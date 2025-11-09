// Study Assistant API - Layer 3 Enhanced Version
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  validateStudyResponse,
  checkEducationalFacts,
  assessResponseConfidence,
  detectContradictions
} from '@/lib/hallucination-prevention/layer3/response-validation-integration';

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

// Graceful AI service manager initialization
async function getAiServiceManagerSafely() {
  try {
    const { aiServiceManager } = await import('@/lib/ai/ai-service-manager-unified');
    return { service: aiServiceManager, error: null, initialized: true } as const;
  } catch (importError) {
    console.warn(
      'AI service manager not available:',
      importError instanceof Error ? importError.message : String(importError)
    );
    return {
      service: null,
      error: importError instanceof Error ? importError.message : String(importError),
      initialized: false,
      reason: 'AI service manager modules not available'
    } as const;
  }
}

// Mock AI response for fallback
function createMockAiResponse(message: string, chatType: string) {
  return {
    content: `I received your message: "${message}". I'm currently running in fallback mode as the advanced AI service is being initialized. Please try again in a moment for full AI capabilities.`,
    model_used: 'fallback-v1',
    provider: 'mock-service',
    tokens_used: {
      input: 10,
      output: 20
    },
    latency_ms: 100,
    query_type: chatType || 'study_assistant',
    web_search_enabled: false,
    fallback_used: true,
    cached: false,
    isTimeSensitive: false,
    language: 'english' as const
  };
}

// Simple personal query detection
function detectPersonalQuestion(message: string): boolean {
  const personalKeywords = [
    'my', 'me', 'my account', 'my profile', 'my progress', 'my grade', 
    'my score', 'my performance', 'my results', 'personal', 'my data'
  ];
  
  return personalKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}

// Classify message type for processing
function classifyMessageType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('doubt')) {
    return 'doubt';
  } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
    return 'explanation_request';
  } else if (lowerMessage.includes('practice') || lowerMessage.includes('exercise') || lowerMessage.includes('problem')) {
    return 'practice';
  } else if (lowerMessage.includes('progress') || lowerMessage.includes('grade') || lowerMessage.includes('score')) {
    return 'progress_inquiry';
  } else if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('understand')) {
    return 'study_help';
  } else {
    return 'general';
  }
}

// Extract query classification 
function extractQueryClassification(layer1Result: any): boolean {
  if (layer1Result?.classificationResult) {
    const classification = layer1Result.classificationResult;
    
    if (classification.type === 'personal' || classification.intent === 'personal_query') {
      return true;
    }
  }
  
  return detectPersonalQuestion(layer1Result?.enhancedMessage || '');
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, chatType, isPersonalQuery = false, provider: reqProvider } = await request.json();

    if (!message || !chatType) {
      return NextResponse.json(
        { error: 'Missing required fields: message, chatType' },
        { status: 400 }
      );
    }

    // Derive authenticated user from Supabase JWT
    const dbAuth = getDbForRequest(request);
    if (!dbAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: authData, error: authError } = await dbAuth.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    // Strict UUID validation
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Invalid authenticated user id: must be a UUID' }, { status: 400 });
    }
    const effectiveUserId = userId;

    // Rate limiting per-user per-provider
    const provider = (reqProvider || 'openrouter') as string;
    const { shouldAllow } = await import('@/lib/ai/rate-limit-manager');
    const rl = await shouldAllow(effectiveUserId, provider);
    if (!rl.allow) {
      return NextResponse.json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter }, { status: 429 });
    }

    // Layer 1: Basic input validation and classification
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isPersonal = detectPersonalQuestion(message);
    const messageType = classifyMessageType(message);

    // Handle validation failures (basic validation only for now)
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Empty message not allowed',
          warnings: ['Please provide a valid message']
        },
        { status: 400 }
      );
    }

    // Use enhanced personal query detection
    const actualIsPersonalQuery = isPersonal;

    // Use processed message
    const processedMessage = message;

    // If no conversationId provided, create new conversation
    let finalConversationId = conversationId as string | null | undefined;
    if (!finalConversationId) {
      const db = getDbForRequest(request)!;
      const { data: newConversation, error } = await db
        .from('chat_conversations')
        .insert({
          user_id: effectiveUserId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          chat_type: chatType,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      finalConversationId = newConversation.id;
    } else {
      // Validate ownership of provided conversationId
      const db = getDbForRequest(request)!;
      const { data: conv, error: convErr } = await db
        .from('chat_conversations')
        .select('id, user_id')
        .eq('id', finalConversationId)
        .single();
      if (convErr || !conv || conv.user_id !== effectiveUserId) {
        return NextResponse.json({ error: 'Forbidden: conversation does not belong to user' }, { status: 403 });
      }
    }

    // Store user message
    const db2 = getDbForRequest(request);
    if (!db2) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { error: userMessageError } = await db2
      .from('chat_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'user',
        content: processedMessage,
        context_included: actualIsPersonalQuery
      } as Database['public']['Tables']['chat_messages']['Insert']);

    if (userMessageError) {
      console.error('User message error:', userMessageError);
    }

    // Try to get AI service manager safely
    const { service: aiServiceManager, initialized } = await getAiServiceManagerSafely();

    let aiResponse: any;
    if (aiServiceManager && initialized) {
      try {
        aiResponse = await aiServiceManager.processQuery({
          userId: effectiveUserId,
          message: processedMessage,
          conversationId: finalConversationId,
          chatType: 'study_assistant',
          includeAppData: actualIsPersonalQuery
        });
      } catch (serviceError) {
        console.warn('AI service error, using mock response:', serviceError);
        aiResponse = createMockAiResponse(processedMessage, chatType);
      }
    } else {
      aiResponse = createMockAiResponse(processedMessage, chatType);
    }

    // Store AI response
    const db3 = getDbForRequest(request);
    if (!db3) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const totalTokens = (aiResponse?.tokens_used?.input ?? 0) + (aiResponse?.tokens_used?.output ?? 0);
    const { error: aiMessageError } = await db3
      .from('chat_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'assistant',
        content: aiResponse.content,
        model_used: aiResponse.model_used ?? aiResponse.model ?? 'unknown',
        provider_used: aiResponse.provider_used ?? aiResponse.provider ?? 'unknown',
        tokens_used: totalTokens,
        latency_ms: aiResponse.latency_ms ?? 0,
        context_included: actualIsPersonalQuery
      } as Database['public']['Tables']['chat_messages']['Insert']);

    if (aiMessageError) {
      console.error('AI message error:', aiMessageError);
    }

    // Update conversation timestamp
    const db4 = getDbForRequest(request);
    if (!db4) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await db4
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() } as Database['public']['Tables']['chat_conversations']['Update'])
      .eq('id', finalConversationId);

    // Normalize AI response to expected schema
    const normalized = {
      content: aiResponse.content,
      model_used: aiResponse.model_used ?? aiResponse.model ?? 'unknown',
      provider_used: aiResponse.provider_used ?? aiResponse.provider ?? 'unknown',
      tokens_used: aiResponse.tokens_used ?? { input: 0, output: 0 },
      latency_ms: aiResponse.latency_ms ?? 0,
      query_type: aiResponse.query_type ?? 'general',
      web_search_enabled: aiResponse.web_search_enabled ?? false,
      fallback_used: aiResponse.fallback_used ?? !initialized,
      cached: aiResponse.cached ?? false,
      isTimeSensitive: aiResponse.isTimeSensitive ?? false,
      language: 'english' as const,
      memory_references: [] as any[],
      // Add classification results
      queryClassification: {
        type: actualIsPersonalQuery ? 'personal' : 'general',
        intent: actualIsPersonalQuery ? 'personal_query' : 'educational',
        messageType,
        confidence: 0.8
      }
    };

    // Layer 3: Response Validation and Fact-Checking
    let layer3Results = null;
    try {
      // Create Layer 3 validation request
      const layer3Request = {
        response: {
          id: aiResponse.id || `response_${Date.now()}`,
          content: normalized.content,
          metadata: {
            model_used: normalized.model_used,
            provider_used: normalized.provider_used,
            tokens_used: normalized.tokens_used,
            latency_ms: normalized.latency_ms
          }
        },
        originalRequest: {
          userId: effectiveUserId,
          sessionId,
          conversationId: finalConversationId || 'new',
          message: processedMessage,
          messageType: messageType as any,
          academicLevel: 'high_school' as any,
          urgency: 'medium' as any,
          includeEducationalContext: true,
          requireSourceVerification: false,
          metadata: {}
        } as any,
        context: {
          knowledgeBase: [],
          conversationHistory: [],
          externalSources: [],
          userProfile: null
        },
        validationOptions: {
          validationLevel: 'standard' as const,
          includeFactChecking: true,
          includeConfidenceScoring: true,
          includeContradictionDetection: true
        }
      };

      // Perform Layer 3 validation
      layer3Results = await validateStudyResponse(layer3Request);
      
      // Add Layer 3 validation results to response
      if (!layer3Results.isValid) {
        console.warn('Layer 3 validation failed:', {
          validationScore: layer3Results.validationScore,
          issues: layer3Results.issues
        });
      }

    } catch (layer3Error) {
      console.warn('Layer 3 validation failed, proceeding without:', layer3Error);
      // Don't fail the request if Layer 3 validation fails
    }

    return NextResponse.json({
      success: true,
      data: {
        response: normalized,
        conversationId: finalConversationId,
        timestamp: new Date().toISOString(),
        // Include basic classification results (Layer 1 equivalent)
        layer1Results: {
          isValid: true,
          classification: normalized.queryClassification,
          studyContext: {
            academicLevel: 'high_school',
            contextRequirement: actualIsPersonalQuery ? 'personal' : 'general',
            responseStrategy: actualIsPersonalQuery ? 'personalized' : 'educational'
          },
          recommendations: [],
          warnings: []
        },
        // Include Layer 3 validation results
        ...(layer3Results && {
          layer3Results: {
            isValid: layer3Results.isValid,
            validationScore: layer3Results.validationScore,
            factCheckSummary: layer3Results.factCheckSummary,
            confidenceScore: layer3Results.confidenceScore,
            contradictionAnalysis: layer3Results.contradictionAnalysis,
            issues: layer3Results.issues,
            recommendations: layer3Results.recommendations,
            processingTime: layer3Results.processingTime
          }
        })
      }
    });

  } catch (error) {
    console.error('Study assistant send error:', error);

    // Handle different error types with consistent formatting
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit reached. Please wait before sending another message.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message.includes('service unavailable')) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is temporarily unavailable. Please try again later.',
          retryAfter: 30
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}