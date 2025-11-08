// Conversation Management API Endpoints
// ====================================

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

// GET /api/chat/conversations - List conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');

    const db = getDbForRequest(request);
    if (!db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Derive authenticated user from Supabase JWT
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    let query = db
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

// POST /api/chat/conversations - Create new conversation for current user
export async function POST(request: NextRequest) {
  try {
    const { title, chatType } = await request.json();

    const db = getDbForRequest(request);
    if (!db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!chatType) {
      return NextResponse.json(
        { error: 'Missing required field: chatType' },
        { status: 400 }
      );
    }

    // Derive authenticated user
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    const conversationTitle = title || 'New Conversation';

    const { data: conversation, error } = await db
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
