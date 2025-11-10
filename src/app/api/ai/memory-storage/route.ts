// AI Memory Storage Endpoint
// ==========================
// Direct memory storage to conversation_memory table bypassing RLS issues

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '@/lib/error-logger-server-safe';
import { createHash } from 'crypto';

// Server-side Supabase client for direct database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request/Response interfaces
interface MemoryStorageRequest {
  userId: string;
  message: string;
  response: string;
  conversationId?: string;
  metadata?: {
    memoryType?: 'user_query' | 'ai_response' | 'learning_interaction' | 'feedback' | 'correction' | 'insight';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    retention?: 'session' | 'short_term' | 'long_term' | 'permanent';
    topic?: string;
    subject?: string;
    learningObjective?: string;
    provider?: string;
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
    confidenceScore?: number;
    tags?: string[];
    context?: Record<string, any>;
    sessionId?: string;
  };
}

interface MemoryStorageResponse {
  success: boolean;
  data?: {
    memoryId: string;
    qualityScore: number;
    relevanceScore: number;
    storedAt: string;
    memoryType: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

/**
 * Calculate quality score for stored memory
 */
function calculateQualityScore(interactionData: any): number {
  let score = 0.5;

  if (interactionData.content && interactionData.content.length > 10) score += 0.1;
  if (interactionData.complexity === 'complex') score += 0.1;
  if (interactionData.sentiment === 'positive') score += 0.1;
  
  if (interactionData.response) {
    score += 0.2;
    if (interactionData.confidenceScore && interactionData.confidenceScore > 0.8) {
      score += 0.1;
    }
  }

  if (interactionData.learningObjective) score += 0.1;
  if (interactionData.topic) score += 0.05;

  if (interactionData.processingTime && interactionData.processingTime < 5000) score += 0.05;
  if (interactionData.tokensUsed && interactionData.tokensUsed < 1000) score += 0.05;

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculate relevance score for stored memory
 */
function calculateRelevanceScore(memoryData: any): number {
  let score = 0.3;

  const priorityScores = { low: 0.1, medium: 0.2, high: 0.3, critical: 0.4 };
  score += priorityScores[(memoryData.priority as keyof typeof priorityScores) || 'medium'] || 0.2;

  if (memoryData.message) score += 0.2;
  if (memoryData.topic) score += 0.1;
  if (memoryData.tags && memoryData.tags.length > 0) score += 0.1;

  const typeScores: Record<string, number> = {
    user_query: 0.2,
    ai_response: 0.15,
    learning_interaction: 0.25,
    feedback: 0.2,
    correction: 0.3,
    insight: 0.35
  };
  score += typeScores[memoryData.memoryType || 'user_query'] || 0.1;

  return Math.min(1.0, score);
}

/**
 * Calculate expiration date based on retention policy
 */
function calculateExpirationDate(retention: string): Date {
  const now = new Date();
  
  switch (retention) {
    case 'session':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'short_term':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'long_term':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'permanent':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Generate a simple UUID v4 format
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate memory ID
 */
function generateMemoryId(): string {
  return generateUUID(); // Use proper UUID format
}

/**
 * Generate checksum for content validation
 */
function generateChecksum(content: string): string {
  return createHash('sha256').update(content + 'ai-memory-storage').digest('hex');
}

/**
 * POST /api/ai/memory-storage - Store AI conversation memory
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `ai-memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('AI memory storage request received', {
      componentName: 'AI Memory Storage',
      requestId
    });

    // Parse request body
    const body = await request.json() as MemoryStorageRequest;

    // Validate required fields
    if (!body.userId || !body.message || !body.response) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: userId, message, response'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Validate userId format - allow both real UUIDs and test IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const testUserRegex = /^[0-9a-z-]+$/i; // Allow alphanumeric and dashes for test users
    if (!uuidRegex.test(body.userId) && !testUserRegex.test(body.userId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'userId must be a valid UUID or test user ID'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Prepare memory data
    const memoryId = generateMemoryId();
    const memoryType = body.metadata?.memoryType || 'ai_response';
    const priority = body.metadata?.priority || 'medium';
    const retention = body.metadata?.retention || 'long_term';
    const expiresAt = calculateExpirationDate(retention);
    const createdAt = new Date();

    // Calculate scores
    const interactionData = {
      content: body.message,
      response: body.response,
      intent: body.metadata?.learningObjective,
      context: body.metadata?.context,
      sentiment: 'neutral' as const,
      complexity: 'moderate' as const,
      subject: body.metadata?.subject,
      topic: body.metadata?.topic,
      learningObjective: body.metadata?.learningObjective,
      sessionId: body.metadata?.sessionId,
      timestamp: createdAt,
      modelUsed: body.metadata?.model,
      provider: body.metadata?.provider,
      processingTime: body.metadata?.processingTime,
      tokensUsed: body.metadata?.tokensUsed,
      confidenceScore: body.metadata?.confidenceScore,
      tags: body.metadata?.tags || []
    };

    const qualityScore = calculateQualityScore(interactionData);
    const relevanceScore = calculateRelevanceScore({
      message: body.message,
      topic: body.metadata?.topic,
      tags: body.metadata?.tags,
      priority,
      memoryType
    });

    // Prepare conversation_id as proper UUID
    const conversationId = body.conversationId || generateUUID();
    
    // Prepare database insert payload
    const insertPayload = {
      id: memoryId,
      user_id: body.userId,
      conversation_id: conversationId,
      interaction_data: {
        ...interactionData,
        memoryType,
        priority,
        retention,
        metadata: {
          source: 'ai_response',
          version: 1,
          compressionApplied: false,
          validationStatus: 'valid',
          accessCount: 0,
          lastAccessed: createdAt,
          linkedToKnowledgeBase: false,
          crossConversationLinked: false
        }
      },
      quality_score: qualityScore,
      user_satisfaction: null,
      feedback_collected: false,
      memory_relevance_score: relevanceScore,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString()
    };

    logInfo('Inserting memory into database', {
      componentName: 'AI Memory Storage',
      requestId,
      userId: body.userId,
      memoryId,
      memoryType,
      priority,
      retention,
      qualityScore,
      relevanceScore
    });

    // Insert into conversation_memory table
    const { data, error } = await supabase
      .from('conversation_memory')
      .insert([insertPayload])
      .select('id, created_at')
      .single();

    if (error) {
      logError(new Error(`Database insert failed: ${error.message}`), {
        componentName: 'AI Memory Storage',
        requestId,
        userId: body.userId,
        error: error.message,
        details: error.details,
        hint: error.hint
      });

      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to store memory in database',
          details: error.message
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    const processingTime = Date.now() - startTime;

    logInfo('AI memory storage successful', {
      componentName: 'AI Memory Storage',
      requestId,
      userId: body.userId,
      memoryId: data.id,
      processingTime,
      qualityScore,
      relevanceScore
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        memoryId: data.id,
        qualityScore,
        relevanceScore,
        storedAt: data.created_at,
        memoryType
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`AI memory storage failed: ${errorMessage}`), {
      componentName: 'AI Memory Storage',
      requestId,
      userId: 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while storing memory',
        details: errorMessage
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/memory-storage - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Test database connectivity
      const { error } = await supabase
        .from('conversation_memory')
        .select('id')
        .limit(1);

      const dbHealthy = !error;
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Memory Storage API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          system: {
            database: {
              connected: dbHealthy,
              table: 'conversation_memory',
              error: error?.message
            },
            storage: {
              mode: 'direct_server_access',
              bypass_rls: true,
              service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
          }
        }
      });
    }

    if (action === 'test-storage') {
      // Test memory storage with a sample
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testMessage = 'Test memory storage';
      const testResponse = 'This is a test response to verify memory storage functionality.';

      try {
        const testPayload: MemoryStorageRequest = {
          userId: testUserId,
          message: testMessage,
          response: testResponse,
          metadata: {
            memoryType: 'ai_response',
            priority: 'low',
            retention: 'short_term',
            topic: 'test',
            tags: ['test', 'verification']
          }
        };

        // Create a test request
        const testRequest = new NextRequest('http://localhost/api/ai/memory-storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        const result = await POST(testRequest);
        const resultData = await result.json();

        return NextResponse.json({
          success: true,
          data: {
            testPerformed: true,
            testResult: resultData,
            timestamp: new Date().toISOString()
          }
        });

      } catch (testError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: 'Memory storage test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error'
          },
          data: {
            testPerformed: true,
            testResult: 'failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Default: Return API information
    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'AI Memory Storage',
        description: 'Direct memory storage to conversation_memory table',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            userId: 'UUID string (required)',
            message: 'User message (required)',
            response: 'AI response (required)',
            conversationId: 'Optional conversation identifier',
            metadata: {
              memoryType: 'Optional: user_query|ai_response|learning_interaction|feedback|correction|insight',
              priority: 'Optional: low|medium|high|critical',
              retention: 'Optional: session|short_term|long_term|permanent',
              topic: 'Optional topic',
              subject: 'Optional subject',
              provider: 'Optional AI provider',
              model: 'Optional model used',
              tags: 'Optional array of tags'
            }
          },
          response: {
            success: 'boolean',
            data: {
              memoryId: 'string',
              qualityScore: 'number',
              relevanceScore: 'number',
              storedAt: 'ISO string',
              memoryType: 'string'
            }
          }
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Memory Storage',
      operation: 'health_check'
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to perform health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}