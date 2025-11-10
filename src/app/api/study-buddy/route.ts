import { NextRequest, NextResponse } from 'next/server';
import { memoryContextProvider } from '@/lib/ai/memory-context-provider';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Helper function to get authenticated Supabase client
function getDbForRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// Personal query detection
function detectPersonalQuestion(message: string): boolean {
  const personalKeywords = [
    'my', 'me', 'my name', 'do you know', 'who am i', 'what is my',
    'my account', 'my profile', 'my progress', 'my grade',
    'my score', 'my performance', 'my results', 'personal', 'my data',
    'kaise', 'mera', 'meri', 'main', 'mujhe', 'maine bola'
  ];
  
  return personalKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `study-buddy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] Processing study buddy request`);

    // Parse request body
    const body = await request.json() as any;
    const { conversationId, message, chatType, isPersonalQuery, provider } = body;

    // Validate required fields
    if (!message || !chatType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: message, chatType'
      }, { status: 400 });
    }

    // Get authenticated user
    const dbAuth = getDbForRequest(request);
    if (!dbAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: authData, error: authError } = await dbAuth.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    // Determine if this is a personal query
    const actualIsPersonalQuery = isPersonalQuery || detectPersonalQuestion(message);

    // Get memory context for this query
    let memoryContext = {
      memories: [] as any[],
      contextString: '',
      personalFacts: [] as string[],
      searchStats: { totalFound: 0, searchTimeMs: 0, provider: 'cohere' as any }
    };

    try {
      memoryContext = await memoryContextProvider.getMemoryContext({
        userId,
        query: message,
        chatType: chatType,
        isPersonalQuery: actualIsPersonalQuery,
        contextLevel: actualIsPersonalQuery ? 'comprehensive' : 'balanced',
        limit: actualIsPersonalQuery ? 8 : 5
      });
    } catch (memoryError) {
      console.warn('Failed to get memory context, proceeding without:', memoryError);
      // Continue without memory context if it fails
    }

    // Use the unified AI chat endpoint that handles memory automatically
    const aiChatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Study-Buddy-API/1.0'
      },
      body: JSON.stringify({
        userId,
        message: memoryContext.contextString ?
          `${memoryContext.contextString}\n\nCurrent question: ${message}` : message,
        conversationId,
        chatType: 'study_assistant',
        includeMemoryContext: true,
        includePersonalizedSuggestions: true,
        memoryOptions: {
          query: actualIsPersonalQuery ? message : undefined,
          limit: 5,
          minSimilarity: 0.1,
          searchType: 'hybrid',
          contextLevel: 'balanced'
        }
      })
    });

    if (!aiChatResponse.ok) {
      throw new Error(`AI chat failed: ${aiChatResponse.status} ${aiChatResponse.statusText}`);
    }

    const aiChatData = await aiChatResponse.json();

    if (!aiChatData.success) {
      throw new Error(aiChatData.error?.message || 'AI chat failed');
    }

    // Create memory references for the response
    const memoryReferences = memoryContext.memories.map((memory: any, index: number) => ({
      id: memory.id,
      content: memory.content,
      importance_score: memory.importance_score,
      relevance: memory.similarity ? `${(memory.similarity * 100).toFixed(0)}%` : 'unknown',
      tags: memory.tags || [],
      created_at: memory.created_at
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        response: {
          content: aiChatData.data.aiResponse.content,
          model_used: aiChatData.data.aiResponse.model_used,
          provider_used: aiChatData.data.aiResponse.provider_used,
          tokens_used: aiChatData.data.aiResponse.tokens_used,
          latency_ms: aiChatData.data.aiResponse.latency_ms,
          query_type: aiChatData.data.aiResponse.query_type,
          web_search_enabled: aiChatData.data.aiResponse.web_search_enabled,
          fallback_used: aiChatData.data.aiResponse.fallback_used,
          cached: aiChatData.data.aiResponse.cached,
          memory_references: memoryReferences
        },
        conversationId: conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        // Include memory context information
        memoryContext: {
          memoriesFound: memoryContext.memories.length,
          searchTimeMs: memoryContext.searchStats.searchTimeMs,
          personalFacts: memoryContext.personalFacts,
          searchStats: memoryContext.searchStats
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Study Buddy API error:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        success: true,
        data: {
          system: {
            status: 'healthy',
            layer5: {
              initialized: true,
              services: {
                orchestration: false, // Simplified version
                integration: false,
                monitoring: false,
                optimization: false,
                compliance: false
              }
            }
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Default health check
    return NextResponse.json({
      success: true,
      data: {
        status: 'Study Buddy API is operational (Simplified Version)',
        version: '2.0.0-simplified',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Study Buddy API GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Health check failed'
      }
    }, { status: 500 });
  }
}