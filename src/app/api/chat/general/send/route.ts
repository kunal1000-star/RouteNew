// Chat API Endpoints - Phase 3: General Chat Integration with Error Handling
// ========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

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
    // Try to import ai-service-manager
    const { aiServiceManager } = await import('@/lib/ai/ai-service-manager-unified');
    return { service: aiServiceManager, error: null, initialized: true };
  } catch (importError) {
    console.warn('AI service manager not available:', importError instanceof Error ? importError.message : String(importError));
    return {
      service: null,
      error: importError instanceof Error ? importError.message : String(importError),
      initialized: false,
      reason: 'AI service manager modules not available'
    };
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
    query_type: 'general',
    web_search_enabled: false,
    fallback_used: true,
    cached: false,
    isTimeSensitive: false,
    language: 'english' as const
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Incoming request headers:', request.headers);
    const requestBody = await request.json();
    console.log('Parsed request body:', requestBody);
    const { conversationId, message, chatType } = requestBody;

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

    // Strict UUID validation (no fallback)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Invalid authenticated user id: must be a UUID' }, { status: 400 });
    }
    const effectiveUserId = userId;

    // Rate limiting per-user per-provider
    const provider = (requestBody?.provider || 'openrouter') as string;
    const { shouldAllow } = await import('@/lib/ai/rate-limit-manager');
    const rl = await shouldAllow(effectiveUserId, provider);
    if (!rl.allow) {
      return NextResponse.json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter }, { status: 429 });
    }

    // Additional logging for debugging
    console.log('UserId (derived):', effectiveUserId);
    console.log('ConversationId:', conversationId);
    console.log('Message:', message);
    console.log('ChatType:', chatType);

    // If no conversationId provided, create new conversation
    let finalConversationId = conversationId;
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
        content: message,
        context_included: false
      });

    if (userMessageError) {
      throw new Error(`Failed to store user message: ${userMessageError.message}`);
    }

    // Try to get AI service manager safely
    const { service: aiServiceManager, initialized } = await getAiServiceManagerSafely();
    
    let aiResponse;
    
    if (aiServiceManager && initialized) {
      try {
        // Call AI Service Manager
        aiResponse = await aiServiceManager.processQuery({
          userId: effectiveUserId,
          conversationId: finalConversationId,
          message,
          chatType,
          includeAppData: false,
          preferredProvider: provider as any
        });
      } catch (serviceError) {
        console.warn('AI service error, using mock response:', serviceError);
        aiResponse = createMockAiResponse(message, chatType);
      }
    } else {
      // Use mock response when service is unavailable
      aiResponse = createMockAiResponse(message, chatType);
    }

    // Store AI response
    const db3 = getDbForRequest(request);
    if (!db3) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { error: aiMessageError } = await db3
          .from('chat_messages')
          .insert({
            conversation_id: finalConversationId,
            role: 'assistant',
            content: aiResponse.content,
            model_used: aiResponse.model_used,
            provider_used: aiResponse.provider,
            tokens_used: aiResponse.tokens_used.input + aiResponse.tokens_used.output,
            latency_ms: aiResponse.latency_ms,
            context_included: aiResponse.web_search_enabled
          } as Database['public']['Tables']['chat_messages']['Insert']);

    if (aiMessageError) {
      throw new Error(`Failed to store AI message: ${aiMessageError.message}`);
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
      tokens_used: aiResponse.tokens_used,
      latency_ms: aiResponse.latency_ms,
      query_type: aiResponse.query_type ?? 'general',
      web_search_enabled: aiResponse.web_search_enabled ?? false,
      fallback_used: aiResponse.fallback_used ?? !initialized,
      cached: aiResponse.cached ?? false,
      isTimeSensitive: aiResponse.isTimeSensitive ?? false,
      language: aiResponse.language ?? 'english'
    };

    return NextResponse.json({
      success: true,
      data: {
        response: normalized,
        conversationId: finalConversationId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
