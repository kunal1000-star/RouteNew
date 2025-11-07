// Study Assistant API - Phase 4: Study Buddy Integration
// ====================================================

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

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      conversationId, 
      message, 
      chatType,
      isPersonalQuery = false
    } = await request.json();

    if (!userId || !message || !chatType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, message, chatType' },
        { status: 400 }
      );
    }

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
        context_included: isPersonalQuery
      });

    if (userMessageError) {
      console.error('User message error:', userMessageError);
      // Don't fail the entire request if message storage fails
    }

    // Call AI Service Manager
    const aiResponse = await aiServiceManager.processQuery({
      userId,
      message,
      conversationId: finalConversationId,
      chatType: 'study_assistant',
      includeAppData: isPersonalQuery
    });

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
        tokens_used: aiResponse.tokens_used?.input + aiResponse.tokens_used?.output || 0,
        latency_ms: aiResponse.latency_ms,
        context_included: isPersonalQuery
      });

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

    return NextResponse.json({
      success: true,
      data: {
        response: {
          content: aiResponse.content,
          model_used: aiResponse.model_used,
          provider_used: aiResponse.provider,
          tokens_used: aiResponse.tokens_used || { input: 0, output: 0 },
          latency_ms: aiResponse.latency_ms,
          query_type: aiResponse.query_type || 'general',
          web_search_enabled: aiResponse.web_search_enabled || false,
          fallback_used: aiResponse.fallback_used || false,
          cached: aiResponse.cached || false,
          isTimeSensitive: false,
          language: 'hinglish',
          memory_references: []
        }
      },
      conversationId: finalConversationId,
      timestamp: new Date().toISOString()
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
