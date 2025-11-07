// Chat API Endpoints - Phase 3: General Chat Integration with Error Handling
// ========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
import type { Database } from '@/lib/database.types';

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
    const { userId, conversationId, message, chatType } = requestBody;

    if (!userId || !message || !chatType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, message, chatType' },
        { status: 400 }
      );
    }

    // Additional logging for debugging
    console.log('UserId:', userId);
    console.log('ConversationId:', conversationId);
    console.log('Message:', message);
    console.log('ChatType:', chatType);

    // If no conversationId provided, create new conversation
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      const db = getDbForRequest(request);
      if (!db) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
          userId,
          conversationId: finalConversationId,
          message,
          chatType,
          includeAppData: false
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

    return NextResponse.json({
      response: aiResponse,
      conversationId: finalConversationId,
      metadata: {
        serviceInitialized: initialized,
        fallbackMode: !initialized
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
