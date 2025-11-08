// Messages API for Chat Conversations
// ===================================

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

// GET /api/chat/messages?conversationId=xxx - Get messages for a conversation that belongs to the current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId parameter' },
        { status: 400 }
      );
    }

    const db = getDbForRequest(request);
    if (!db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Derive authenticated user
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    // Validate ownership
    const { data: conv, error: convErr } = await db
      .from('chat_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();
    if (convErr || !conv || conv.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: conversation does not belong to user' }, { status: 403 });
    }

    const { data: messages, error } = await db
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/messages?id=xxx - Delete a conversation that belongs to the current user (and its messages)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversation ID' },
        { status: 400 }
      );
    }

    const db = getDbForRequest(request);
    if (!db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Derive authenticated user
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing token' }, { status: 401 });
    }
    const userId = authData.user.id;

    // Validate ownership before delete
    const { data: conv, error: convErr } = await db
      .from('chat_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();
    if (convErr || !conv || conv.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: conversation does not belong to user' }, { status: 403 });
    }

    // Delete messages first (cascade)
    const { error: messagesError } = await db
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      throw new Error(`Failed to delete messages: ${messagesError.message}`);
    }

    // Delete conversation
    const { error: conversationError } = await db
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) {
      throw new Error(`Failed to delete conversation: ${conversationError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
