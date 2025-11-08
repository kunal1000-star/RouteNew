// Study Assistant API - Phase 4: Study Buddy Integration
// ====================================================

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

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, chatType, isPersonalQuery = false } = await request.json();

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

    // If no conversationId provided, create new conversation
    let finalConversationId = conversationId as string | null | undefined;
    if (!finalConversationId) {
      const db = getDbForRequest(request)!;
      const { data: newConversation, error } = await db
        .from('chat_conversations')
        .insert({
          user_id: userId,
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
      if (convErr || !conv || conv.user_id !== userId) {
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
        context_included: isPersonalQuery
      } as Database['public']['Tables']['chat_messages']['Insert']);

    if (userMessageError) {
      // Log but do not fail the entire request
      console.error('User message error:', userMessageError);
    }

    // Try to get AI service manager safely
    const { service: aiServiceManager, initialized } = await getAiServiceManagerSafely();

    let aiResponse: any;
    if (aiServiceManager && initialized) {
      try {
        aiResponse = await aiServiceManager.processQuery({
          userId,
          message,
          conversationId: finalConversationId,
          chatType: 'study_assistant',
          includeAppData: isPersonalQuery
        });
      } catch (serviceError) {
        console.warn('AI service error, using mock response:', serviceError);
        aiResponse = createMockAiResponse(message, chatType);
      }
    } else {
      aiResponse = createMockAiResponse(message, chatType);
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
        context_included: isPersonalQuery
      } as Database['public']['Tables']['chat_messages']['Insert']);

    if (aiMessageError) {
      console.error('AI message error:', aiMessageError);
      // Don't fail the entire request if AI response storage fails
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
      language: 'hinglish',
      memory_references: [] as any[]
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
