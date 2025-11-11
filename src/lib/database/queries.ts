// ============================================================================
// AI DATABASE QUERY UTILITIES - Basic Implementation
// ============================================================================

import { supabase } from '../supabase';

// Basic error classes
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class VectorSearchError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(message, 'VECTOR_SEARCH_ERROR', details);
    this.name = 'VectorSearchError';
  }
}

export class SecurityError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Chat conversation operations
export class ChatQueries {
  static async createConversation(userId: string, title: string, chatType: 'general' | 'study_assistant' = 'general') {
    if (!UUID_REGEX.test(userId)) {
      throw new DatabaseError('Invalid userId: must be UUID', 'INVALID_INPUT');
    }
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title,
          chat_type: chatType
        })
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to create conversation: ${error.message}`, error.code, error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create conversation', 'UNKNOWN_ERROR', error);
    }
  }

  static async getUserConversations(userId: string, options: { limit?: number; includeArchived?: boolean } = {}) {
    try {
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!options.includeArchived) {
        query = query.eq('is_archived', false);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw new DatabaseError(`Failed to fetch conversations: ${error.message}`, error.code, error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch conversations', 'UNKNOWN_ERROR', error);
    }
  }

  static async addMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata: any = {}) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          model_used: metadata.model_used,
          provider_used: metadata.provider_used,
          tokens_used: metadata.tokens_used || 0,
          latency_ms: metadata.latency_ms,
          context_included: metadata.context_included || false
        })
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to add message: ${error.message}`, error.code, error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to add message', 'UNKNOWN_ERROR', error);
    }
  }
}

// Memory and vector search operations
export class MemoryQueries {
  static async addMemory(userId: string, content: string, embedding: number[], importanceScore: number, options: any = {}) {
    try {
      // Support both 1536 and 1024 dimension embeddings
      if (embedding.length !== 1536 && embedding.length !== 1024) {
        throw new VectorSearchError(`Invalid embedding dimension: expected 1536 or 1024, got ${embedding.length}`);
      }

      const { data, error } = await supabase
        .from('study_chat_memory')
        .insert({
          user_id: userId,
          content,
          embedding,
          importance_score: importanceScore,
          tags: options.tags,
          source_conversation_id: options.sourceConversationId
        })
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to add memory: ${error.message}`, error.code, error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof VectorSearchError) throw error;
      throw new DatabaseError('Failed to add memory', 'UNKNOWN_ERROR', error);
    }
  }

  static async findSimilarMemories(userId: string, embedding: number[], options: any = {}) {
    try {
      // Support both 1536 and 1024 dimension embeddings
      if (embedding.length !== 1536 && embedding.length !== 1024) {
        throw new VectorSearchError(`Invalid embedding dimension: expected 1536 or 1024, got ${embedding.length}`);
      }

      // Validate and format userId to UUID
      let validUserId: string;
      if (userId === 'anonymous-user' || userId.startsWith('conv-')) {
        // Generate a valid UUID for anonymous users or invalid userIds
        validUserId = crypto.randomUUID();
      } else if (UUID_REGEX.test(userId)) {
        validUserId = userId;
      } else {
        // For any other invalid format, generate a UUID
        validUserId = crypto.randomUUID();
      }

      // Try vector search first with find_similar_memories function
      const { data, error } = await supabase.rpc('find_similar_memories', {
        p_user_id: validUserId,
        p_embedding: embedding,
        p_limit: options.limit || 5,
        p_min_similarity: options.min_similarity || 0.7
      });

      if (error) {
        console.warn('Vector search function failed, falling back to direct table query:', error);
        
        // Fallback: Direct query to conversation_memory table with basic similarity
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversation_memory')
          .select('*')
          .eq('user_id', userId)
          .order('memory_relevance_score', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(options.limit || 5);

        if (fallbackError) {
          throw new VectorSearchError(`Direct memory search failed: ${fallbackError.message}`, fallbackError);
        }

        // Transform conversation_memory format to memory format with basic similarity
        let results = (fallbackData || []).map((memory: any) => ({
          ...memory,
          similarity: memory.memory_relevance_score || 0.5 // Use relevance score as similarity fallback
        }));
        
        if (options.min_similarity) {
          results = results.filter((memory: any) => memory.similarity >= options.min_similarity);
        }

        return results;
      }

      let results = data || [];
      
      if (options.tags && options.tags.length > 0) {
        results = results.filter((memory: any) => 
          memory.tags && memory.tags.some((tag: string) => options.tags.includes(tag))
        );
      }

      if (options.importance_score) {
        results = results.filter((memory: any) => memory.importance_score >= options.importance_score);
      }

      return results;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof VectorSearchError) throw error;
      throw new VectorSearchError('Failed to search memories', 'UNKNOWN_ERROR', error);
    }
  }
}

// Profile operations
export class ProfileQueries {
  static async upsertProfile(userId: string, profileData: any) {
    try {
      const { data, error } = await supabase
        .from('student_ai_profile')
        .upsert({
          user_id: userId,
          ...profileData,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to upsert profile: ${error.message}`, error.code, error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to upsert profile', 'UNKNOWN_ERROR', error);
    }
  }

  static async getProfile(userId: string) {
    try {
      // Use maybeSingle() to avoid "Cannot coerce the result to a single JSON object" error
      const { data, error } = await supabase
        .from('student_ai_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to fetch profile: ${error.message}`, error.code, error);
      }
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch profile', 'UNKNOWN_ERROR', error);
    }
  }
}

// API usage tracking
export class APIUsageQueries {
  static async logUsage(userId: string | null, featureName: string, providerUsed: string, modelUsed: string, metadata: any = {}) {
    try {
      // First try with the enhanced function that includes query_type
      try {
        const { data, error } = await supabase.rpc('log_api_usage', {
          p_user_id: userId,
          p_feature_name: featureName,
          p_provider_used: providerUsed,
          p_model_used: modelUsed,
          p_tokens_input: metadata.tokens_input || 0,
          p_tokens_output: metadata.tokens_output || 0,
          p_latency_ms: metadata.latency_ms || 0,
          p_success: metadata.success !== false,
          p_error_message: metadata.error_message,
          p_query_type: metadata.query_type || 'general'
        });

        if (!error) return data;
      } catch (rpcError) {
        // RPC might not exist yet, fall back to direct insert
      }

      // Fallback: Direct insert to api_usage_logs table
      const { data, error } = await supabase
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          feature_name: featureName,
          provider_used: providerUsed,
          model_used: modelUsed,
          tokens_input: metadata.tokens_input || 0,
          tokens_output: metadata.tokens_output || 0,
          latency_ms: metadata.latency_ms || 0,
          success: metadata.success !== false,
          error_message: metadata.error_message,
          query_type: metadata.query_type || 'general' // This might fail if column doesn't exist
        })
        .select()
        .single();

      if (error && error.code === 'PGRST204') {
        // Column doesn't exist yet, try without query_type
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('api_usage_logs')
          .insert({
            user_id: userId,
            feature_name: featureName,
            provider_used: providerUsed,
            model_used: modelUsed,
            tokens_input: metadata.tokens_input || 0,
            tokens_output: metadata.tokens_output || 0,
            latency_ms: metadata.latency_ms || 0,
            success: metadata.success !== false,
            error_message: metadata.error_message
          })
          .select()
          .single();

        if (fallbackError) throw new DatabaseError(`Failed to log API usage: ${fallbackError.message}`, fallbackError.code, fallbackError);
        return fallbackData;
      } else if (error) {
        throw new DatabaseError(`Failed to log API usage: ${error.message}`, error.code, error);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to log API usage', 'UNKNOWN_ERROR', error);
    }
  }
}

// System prompts
export class PromptQueries {
  static async getActivePrompts() {
    try {
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false });

      if (error) throw new DatabaseError(`Failed to fetch prompts: ${error.message}`, error.code, error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch prompts', 'UNKNOWN_ERROR', error);
    }
  }

  static async getPromptByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to fetch prompt: ${error.message}`, error.code, error);
      }
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch prompt', 'UNKNOWN_ERROR', error);
    }
  }
}

// Maintenance operations

// ================= Per-user provider keys and limits =================
import { encryptSecret, decryptSecret } from '@/lib/utils/crypto';

export type Provider = 'openrouter' | 'groq' | 'gemini' | 'mistral' | 'cohere' | 'cerebras';

export async function upsertUserProviderKey(userId: string, provider: Provider, apiKey: string) {
  const { ciphertext, iv } = encryptSecret(apiKey);
  const { error } = await supabase
    .from('user_provider_keys')
    .upsert({
      user_id: userId,
      provider,
      encrypted_key: ciphertext,
      iv,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
  if (error) throw new DatabaseError(`Failed to save provider key: ${error.message}`, error.code, error);
}

export async function deleteUserProviderKey(userId: string, provider: Provider) {
  const { error } = await supabase
    .from('user_provider_keys')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw new DatabaseError(`Failed to delete provider key: ${error.message}`, error.code, error);
}

export async function getUserProviderKey(userId: string, provider: Provider): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_provider_keys')
    .select('encrypted_key, iv')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to fetch provider key: ${error.message}`, error.code, error);
  if (!data) return null;
  const key = decryptSecret(Buffer.from(data.encrypted_key as any), Buffer.from(data.iv as any));
  return key;
}

export async function listUserProviderKeyStatus(userId: string) {
  const providers: Provider[] = ['openrouter','groq','gemini','mistral','cohere','cerebras'];
  const { data, error } = await supabase
    .from('user_provider_keys')
    .select('provider')
    .eq('user_id', userId);
  if (error) throw new DatabaseError(`Failed to list provider keys: ${error.message}`, error.code, error);
  const set = new Set((data || []).map(d => d.provider as Provider));
  return providers.map(p => ({ provider: p, hasKey: set.has(p) }));
}

export async function upsertUserProviderLimit(userId: string, provider: Provider, maxPerMin: number) {
  const { error } = await supabase
    .from('user_provider_limits')
    .upsert({
      user_id: userId,
      provider,
      max_requests_per_min: maxPerMin,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
  if (error) throw new DatabaseError(`Failed to save provider limit: ${error.message}`, error.code, error);
}

export async function getUserProviderLimit(userId: string, provider: Provider): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_provider_limits')
    .select('max_requests_per_min')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to fetch provider limit: ${error.message}`, error.code, error);
  return data?.max_requests_per_min ?? null;
}

export async function listUserProviderLimits(userId: string): Promise<Array<{provider: Provider; max_requests_per_min: number}>> {
  const providers: Provider[] = ['openrouter','groq','gemini','mistral','cohere','cerebras'];
  const { data, error } = await supabase
    .from('user_provider_limits')
    .select('provider, max_requests_per_min')
    .eq('user_id', userId);
  if (error) throw new DatabaseError(`Failed to list provider limits: ${error.message}`, error.code, error);
  const map = new Map<string, number>();
  (data || []).forEach(r => map.set(r.provider as string, r.max_requests_per_min as number));
  return providers.map(p => ({ provider: p, max_requests_per_min: map.get(p) ?? 60 }));
}

export class MaintenanceQueries {
  static async runMaintenanceTasks() {
    try {
      const { data, error } = await supabase.rpc('run_maintenance_tasks');
      if (error) throw new DatabaseError(`Failed to run maintenance tasks: ${error.message}`, error.code, error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to run maintenance tasks', 'UNKNOWN_ERROR', error);
    }
  }
}

// Export the class for module access
// Named export removed; class is already exported above
