// Conversation Persistence Hook
// ============================
// Extends the existing useStudyBuddy hook to add comprehensive database storage

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, supabaseBrowserClient } from '@/lib/supabase';
import type { ChatMessage } from '@/types/study-buddy';

// Database types
export interface DatabaseConversation {
  id: string;
  user_id: string;
  title: string;
  chat_type: 'general' | 'study_assistant' | 'tutoring' | 'review';
  metadata: Record<string, any>;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  message_count: number;
  token_count: number;
  status: 'active' | 'archived' | 'deleted';
}

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  provider_used?: string;
  tokens_used: number;
  latency_ms?: number;
  context_included: boolean;
  metadata: Record<string, any>;
  attachments: any[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationSettings {
  id: string;
  conversation_id: string;
  user_id: string;
  ai_provider: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  stream_responses: boolean;
  include_memory_context: boolean;
  include_personal_context: boolean;
  auto_save: boolean;
  custom_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationFilters {
  page?: number;
  limit?: number;
  chat_type?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
  status?: string;
  search?: string;
  sort_by?: 'last_activity_at' | 'created_at' | 'title' | 'message_count';
  sort_order?: 'asc' | 'desc';
}

export interface UseConversationPersistenceReturn {
  // State
  conversations: DatabaseConversation[];
  currentConversation: DatabaseConversation | null;
  conversationSettings: ConversationSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  
  // Actions
  loadConversations: (filters?: ConversationFilters) => Promise<void>;
  createConversation: (data: Partial<DatabaseConversation>) => Promise<DatabaseConversation | null>;
  updateConversation: (id: string, updates: Partial<DatabaseConversation>) => Promise<DatabaseConversation | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  archiveConversation: (id: string) => Promise<boolean>;
  unarchiveConversation: (id: string) => Promise<boolean>;
  pinConversation: (id: string) => Promise<boolean>;
  unpinConversation: (id: string) => Promise<boolean>;
  setCurrentConversation: (conversation: DatabaseConversation | null) => void;
  
  // Message operations
  loadMessages: (conversationId: string, page?: number, limit?: number) => Promise<DatabaseMessage[]>;
  saveMessage: (message: Omit<DatabaseMessage, 'id' | 'created_at' | 'updated_at'>) => Promise<DatabaseMessage | null>;
  updateMessage: (id: string, updates: Partial<DatabaseMessage>) => Promise<DatabaseMessage | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  syncLocalMessages: (conversationId: string, localMessages: ChatMessage[]) => Promise<void>;
  
  // Settings
  loadSettings: (conversationId: string) => Promise<ConversationSettings | null>;
  updateSettings: (conversationId: string, settings: Partial<ConversationSettings>) => Promise<ConversationSettings | null>;
  
  // Batch operations
  batchArchive: (conversationIds: string[]) => Promise<boolean>;
  batchDelete: (conversationIds: string[]) => Promise<boolean>;
  batchPin: (conversationIds: string[]) => Promise<boolean>;
  batchUnpin: (conversationIds: string[]) => Promise<boolean>;
  
  // Search
  searchConversations: (query: string, filters?: ConversationFilters) => Promise<DatabaseConversation[]>;
}

export function useConversationPersistence(): UseConversationPersistenceReturn {
  const { toast } = useToast();
  
  // State
  const [conversations, setConversations] = useState<DatabaseConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<DatabaseConversation | null>(null);
  const [conversationSettings, setConversationSettings] = useState<ConversationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseConversationPersistenceReturn['pagination']>(null);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to handle API errors
  const handleApiError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const message = error?.message || `Failed to ${operation}`;
    setError(message);
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
    return null;
  }, [toast]);

  // Load conversations with optional filters
  const loadConversations = useCallback(async (filters: ConversationFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/chat/conversations?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setPagination(data.pagination);
      
    } catch (error) {
      handleApiError(error, 'load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  // Create a new conversation
  const createConversation = useCallback(async (data: Partial<DatabaseConversation>): Promise<DatabaseConversation | null> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title || 'New Conversation',
          chat_type: data.chat_type || 'general',
          metadata: data.metadata || {},
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      
      const result = await response.json();
      const newConversation = result.conversation;
      
      // Update local state
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      toast({
        title: 'Success',
        description: 'Conversation created successfully',
      });
      
      return newConversation;
      
    } catch (error) {
      return handleApiError(error, 'create conversation');
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError, toast]);

  // Update conversation
  const updateConversation = useCallback(async (id: string, updates: Partial<DatabaseConversation>): Promise<DatabaseConversation | null> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update conversation');
      }
      
      const result = await response.json();
      const updatedConversation = result.conversation;
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === id ? updatedConversation : conv
      ));
      
      if (currentConversation?.id === id) {
        setCurrentConversation(updatedConversation);
      }
      
      toast({
        title: 'Success',
        description: 'Conversation updated successfully',
      });
      
      return updatedConversation;
      
    } catch (error) {
      return handleApiError(error, 'update conversation');
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError, toast, currentConversation]);

  // Delete conversation (soft delete)
  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/conversations?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setConversationSettings(null);
      }
      
      toast({
        title: 'Success',
        description: 'Conversation deleted successfully',
      });
      
      return true;
      
    } catch (error) {
      handleApiError(error, 'delete conversation');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError, toast, currentConversation]);

  // Archive conversation
  const archiveConversation = useCallback(async (id: string): Promise<boolean> => {
    return updateConversation(id, { is_archived: true }) !== null;
  }, [updateConversation]);

  // Unarchive conversation
  const unarchiveConversation = useCallback(async (id: string): Promise<boolean> => {
    return updateConversation(id, { is_archived: false }) !== null;
  }, [updateConversation]);

  // Pin conversation
  const pinConversation = useCallback(async (id: string): Promise<boolean> => {
    return updateConversation(id, { is_pinned: true }) !== null;
  }, [updateConversation]);

  // Unpin conversation
  const unpinConversation = useCallback(async (id: string): Promise<boolean> => {
    return updateConversation(id, { is_pinned: false }) !== null;
  }, [updateConversation]);

  // Set current conversation
  const setCurrentConversationWrapper = useCallback((conversation: DatabaseConversation | null) => {
    setCurrentConversation(conversation);
    if (conversation) {
      loadSettings(conversation.id);
    } else {
      setConversationSettings(null);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, page = 1, limit = 50): Promise<DatabaseMessage[]> => {
    try {
      const params = new URLSearchParams({
        conversation_id: conversationId,
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await fetch(`/api/chat/messages?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load messages');
      }
      
      const data = await response.json();
      return data.messages || [];
      
    } catch (error) {
      handleApiError(error, 'load messages');
      return [];
    }
  }, [handleApiError]);

  // Save a message to database
  const saveMessage = useCallback(async (message: Omit<DatabaseMessage, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseMessage | null> => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save message');
      }
      
      const result = await response.json();
      return result.message;
      
    } catch (error) {
      return handleApiError(error, 'save message');
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError]);

  // Update message
  const updateMessage = useCallback(async (id: string, updates: Partial<DatabaseMessage>): Promise<DatabaseMessage | null> => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update message');
      }
      
      const result = await response.json();
      return result.message;
      
    } catch (error) {
      return handleApiError(error, 'update message');
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError]);

  // Delete message (soft delete)
  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/chat/messages?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete message');
      }
      
      return true;
      
    } catch (error) {
      handleApiError(error, 'delete message');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError]);

  // Sync local messages with database
  const syncLocalMessages = useCallback(async (conversationId: string, localMessages: ChatMessage[]) => {
    if (!localMessages.length) return;
    
    try {
      // Load existing messages from database
      const existingMessages = await loadMessages(conversationId);
      const existingIds = new Set(existingMessages.map(msg => msg.id));
      
      // Find messages that exist locally but not in database
      const newMessages = localMessages.filter(msg => !existingIds.has(msg.id));
      
      // Save new messages to database
      for (const localMessage of newMessages) {
        await saveMessage({
          conversation_id: conversationId,
          role: localMessage.role,
          content: localMessage.content,
          model_used: localMessage.model,
          provider_used: localMessage.provider,
          tokens_used: localMessage.tokensUsed || 0,
          context_included: false,
          metadata: {},
          attachments: [],
          is_deleted: false,
        });
      }
      
      console.log(`Synced ${newMessages.length} messages to database`);
      
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
  }, [loadMessages, saveMessage]);

  // Load conversation settings
  const loadSettings = useCallback(async (conversationId: string): Promise<ConversationSettings | null> => {
    try {
      const { data, error } = await supabaseBrowserClient
        .from('conversation_settings')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      setConversationSettings(data);
      return data;
      
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }, []);

  // Update conversation settings
  const updateSettings = useCallback(async (conversationId: string, settings: Partial<ConversationSettings>): Promise<ConversationSettings | null> => {
    setIsSaving(true);
    
    try {
      const { data, error } = await supabaseBrowserClient
        .from('conversation_settings')
        .update(settings)
        .eq('conversation_id', conversationId)
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationSettings(data);
      
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
      
      return data;
      
    } catch (error) {
      return handleApiError(error, 'update settings');
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError, toast]);

  // Batch operations
  const batchOperation = useCallback(async (
    operation: 'archive' | 'unarchive' | 'pin' | 'unpin' | 'delete',
    conversationIds: string[]
  ): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          conversation_ids: conversationIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${operation} conversations`);
      }
      
      // Update local state
      setConversations(prev => {
        const updated = [...prev];
        conversationIds.forEach(id => {
          const index = updated.findIndex(conv => conv.id === id);
          if (index !== -1) {
            switch (operation) {
              case 'archive':
                updated[index] = { ...updated[index], is_archived: true };
                break;
              case 'unarchive':
                updated[index] = { ...updated[index], is_archived: false };
                break;
              case 'pin':
                updated[index] = { ...updated[index], is_pinned: true };
                break;
              case 'unpin':
                updated[index] = { ...updated[index], is_pinned: false };
                break;
              case 'delete':
                updated[index] = { ...updated[index], status: 'deleted' };
                break;
            }
          }
        });
        return updated.filter(conv => conv.status !== 'deleted');
      });
      
      toast({
        title: 'Success',
        description: `Batch ${operation} completed successfully`,
      });
      
      return true;
      
    } catch (error) {
      handleApiError(error, `batch ${operation}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [handleApiError, toast]);

  // Batch operations wrapper functions
  const batchArchive = useCallback((ids: string[]) => batchOperation('archive', ids), [batchOperation]);
  const batchDelete = useCallback((ids: string[]) => batchOperation('delete', ids), [batchOperation]);
  const batchPin = useCallback((ids: string[]) => batchOperation('pin', ids), [batchOperation]);
  const batchUnpin = useCallback((ids: string[]) => batchOperation('unpin', ids), [batchOperation]);

  // Search conversations
  const searchConversations = useCallback(async (query: string, filters: ConversationFilters = {}): Promise<DatabaseConversation[]> => {
    const searchFilters = { ...filters, search: query };
    await loadConversations(searchFilters);
    return conversations;
  }, [loadConversations, conversations]);

  return {
    // State
    conversations,
    currentConversation,
    conversationSettings,
    isLoading,
    isSaving,
    error,
    pagination,
    
    // Actions
    loadConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    pinConversation,
    unpinConversation,
    setCurrentConversation: setCurrentConversationWrapper,
    
    // Message operations
    loadMessages,
    saveMessage,
    updateMessage,
    deleteMessage,
    syncLocalMessages,
    
    // Settings
    loadSettings,
    updateSettings,
    
    // Batch operations
    batchArchive,
    batchDelete,
    batchPin,
    batchUnpin,
    
    // Search
    searchConversations,
  };
}