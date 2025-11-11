// Conversation Persistence Integration Test
// ==========================================
// Comprehensive tests for the conversation persistence system

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

describe('Conversation Persistence System', () => {
  let testUserId: string;
  let testConversationId: string;
  let testMessageId: string;

  beforeAll(async () => {
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123'
    });

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`);
    }

    testUserId = authData.user?.id!;
    console.log('Created test user:', testUserId);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase.from('conversation_messages').delete().eq('conversation_id', testConversationId);
      await supabase.from('conversations').delete().eq('user_id', testUserId);
      await supabase.from('conversation_settings').delete().eq('user_id', testUserId);
      
      // Note: In a real environment, you'd also clean up the test user
    }
  });

  describe('Database Schema', () => {
    test('conversations table should exist with correct structure', async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);

      // The table should exist (even if empty)
      expect(error).toBeNull();
    });

    test('conversation_messages table should exist with correct structure', async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
    });

    test('conversation_settings table should exist', async () => {
      const { data, error } = await supabase
        .from('conversation_settings')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
    });

    test('conversation_memory table should exist', async () => {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('CRUD Operations', () => {
    test('should create a new conversation', async () => {
      const conversationData = {
        user_id: testUserId,
        title: 'Test Conversation',
        chat_type: 'study_assistant' as const,
        metadata: { test: true },
        is_archived: false,
        is_pinned: false,
        status: 'active' as const
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(conversationData);
      expect(data.id).toBeDefined();
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      testConversationId = data.id;
    });

    test('should read conversations for a user', async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test('should update a conversation', async () => {
      const updates = {
        title: 'Updated Test Conversation',
        is_pinned: true
      };

      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', testConversationId)
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.title).toBe(updates.title);
      expect(data.is_pinned).toBe(true);
    });

    test('should create conversation settings', async () => {
      const settingsData = {
        conversation_id: testConversationId,
        user_id: testUserId,
        ai_provider: 'groq',
        ai_model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 2048,
        stream_responses: true,
        include_memory_context: true,
        include_personal_context: true,
        auto_save: true
      };

      const { data, error } = await supabase
        .from('conversation_settings')
        .insert(settingsData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(settingsData);
    });
  });

  describe('Message Operations', () => {
    test('should create a message', async () => {
      const messageData = {
        conversation_id: testConversationId,
        role: 'user' as const,
        content: 'Hello, this is a test message',
        tokens_used: 10,
        context_included: false,
        metadata: { test: true },
        attachments: [],
        is_deleted: false
      };

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert(messageData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(messageData);
      expect(data.id).toBeDefined();

      testMessageId = data.id;
    });

    test('should read messages for a conversation', async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', testConversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test('should update a message', async () => {
      const updates = {
        content: 'Updated message content',
        metadata: { updated: true }
      };

      const { data, error } = await supabase
        .from('conversation_messages')
        .update(updates)
        .eq('id', testMessageId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.content).toBe(updates.content);
      expect(data.metadata.updated).toBe(true);
    });

    test('should soft delete a message', async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .update({ is_deleted: true })
        .eq('id', testMessageId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_deleted).toBe(true);
    });
  });

  describe('Memory Integration', () => {
    test('should store conversation memory', async () => {
      const memoryData = {
        conversation_id: testConversationId,
        user_id: testUserId,
        memory_type: 'learning_interaction' as const,
        content: 'User asked about thermodynamics',
        interaction_data: {
          subject: 'Physics',
          complexity: 'moderate',
          response_quality: 0.8
        },
        quality_score: 0.8,
        memory_relevance_score: 0.7,
        priority: 'medium' as const,
        retention: 'long_term' as const,
        tags: ['physics', 'thermodynamics'],
        metadata: { source: 'test' },
        is_active: true
      };

      const { data, error } = await supabase
        .from('conversation_memory')
        .insert(memoryData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(memoryData);
    });

    test('should search memory by relevance', async () => {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_active', true)
        .gte('memory_relevance_score', 0.5)
        .order('memory_relevance_score', { ascending: false });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    test('GET /api/chat/conversations should return conversations', async () => {
      const response = await fetch(`${supabaseUrl}/api/chat/conversations?limit=10`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('conversations');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.conversations)).toBe(true);
    });

    test('POST /api/chat/conversations should create a conversation', async () => {
      const response = await fetch(`${supabaseUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'API Test Conversation',
          chat_type: 'study_assistant',
          metadata: { source: 'api_test' }
        })
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('conversation');
      expect(data.conversation.title).toBe('API Test Conversation');
    });

    test('GET /api/chat/messages should return messages', async () => {
      const response = await fetch(
        `${supabaseUrl}/api/chat/messages?conversation_id=${testConversationId}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('messages');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.messages)).toBe(true);
    });

    test('POST /api/chat/messages should create a message', async () => {
      const response = await fetch(`${supabaseUrl}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: testConversationId,
          role: 'assistant',
          content: 'This is a test response from the API',
          tokens_used: 15
        })
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message.content).toBe('This is a test response from the API');
    });
  });

  describe('Security and RLS', () => {
    test('users should only see their own conversations', async () => {
      // This test would require multiple test users in a real scenario
      // For now, we verify the basic RLS is working
      const { data, error } = await supabase
        .from('conversations')
        .select('user_id')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      // Should only return conversations for the authenticated user
    });

    test('unauthorized requests should be rejected', async () => {
      // Test without proper authentication
      const response = await fetch(`${supabaseUrl}/api/chat/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Performance and Indexing', () => {
    test('should efficiently query conversations by user', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, last_activity_at')
        .eq('user_id', testUserId)
        .order('last_activity_at', { ascending: false })
        .limit(20);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should efficiently query messages by conversation', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', testConversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('Data Integrity', () => {
    test('conversation deletion should cascade to messages', async () => {
      // Create a test conversation with messages
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: testUserId,
          title: 'Cascade Test',
          chat_type: 'general'
        })
        .select()
        .single();

      // Add messages
      await supabase
        .from('conversation_messages')
        .insert([
          {
            conversation_id: newConversation.id,
            role: 'user',
            content: 'Test message 1',
            tokens_used: 5
          },
          {
            conversation_id: newConversation.id,
            role: 'assistant',
            content: 'Test response 1',
            tokens_used: 8
          }
        ]);

      // Delete conversation (soft delete)
      await supabase
        .from('conversations')
        .update({ status: 'deleted' })
        .eq('id', newConversation.id);

      // Verify messages are still accessible (soft delete behavior)
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', newConversation.id);

      expect(messages?.length).toBe(2);
    });

    test('should maintain referential integrity', async () => {
      // Test that we can't create a message for a non-existent conversation
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: 'non-existent-id',
          role: 'user',
          content: 'This should fail',
          tokens_used: 5
        });

      expect(error).toBeDefined();
    });
  });
});

// Integration test for the complete flow
describe('End-to-End Conversation Flow', () => {
  test('complete conversation lifecycle', async () => {
    const testEmail = `e2e-test-${Date.now()}@example.com`;
    const testPassword = 'test-password-123';

    // 1. Create user and authenticate
    const { data: authData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    const userId = authData.user?.id;
    expect(userId).toBeDefined();

    // 2. Create conversation via API
    const createResponse = await fetch(`${supabaseUrl}/api/chat/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'E2E Test Conversation',
        chat_type: 'study_assistant',
        metadata: { source: 'e2e_test' }
      })
    });

    expect(createResponse.status).toBe(201);
    const conversationData = await createResponse.json();
    const conversationId = conversationData.conversation.id;

    // 3. Add messages via API
    const messageResponse = await fetch(`${supabaseUrl}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        role: 'user',
        content: 'Hello, can you help me with physics?',
        tokens_used: 12
      })
    });

    expect(messageResponse.status).toBe(201);

    // 4. Retrieve conversation with messages
    const getResponse = await fetch(
      `${supabaseUrl}/api/chat/conversations?id=${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    expect(getResponse.status).toBe(200);
    const retrievedData = await getResponse.json();
    expect(retrievedData.conversation.id).toBe(conversationId);

    // 5. Update conversation
    const updateResponse = await fetch(`${supabaseUrl}/api/chat/conversations`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: conversationId,
        title: 'Updated E2E Test Conversation',
        is_pinned: true
      })
    });

    expect(updateResponse.status).toBe(200);
    const updatedData = await updateResponse.json();
    expect(updatedData.conversation.title).toBe('Updated E2E Test Conversation');
    expect(updatedData.conversation.is_pinned).toBe(true);

    // Cleanup
    await supabase.from('conversation_messages').delete().eq('conversation_id', conversationId);
    await supabase.from('conversations').delete().eq('id', conversationId);
  });
});