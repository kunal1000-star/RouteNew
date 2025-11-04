// Conversation Management API Endpoints
// ====================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/chat/conversations - List conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chatType = searchParams.get('chatType');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('chat_conversations')
      .select('id, title, chat_type, created_at, updated_at, is_archived')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (chatType) {
      query = query.eq('chat_type', chatType);
    }

    const { data: conversations, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const { userId, title, chatType } = await request.json();

    if (!userId || !chatType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, chatType' },
        { status: 400 }
      );
    }

    const conversationTitle = title || 'New Conversation';

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title: conversationTitle,
        chat_type: chatType
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        chat_type: conversation.chat_type,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}