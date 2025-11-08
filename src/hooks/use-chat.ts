'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GeneralChatMessage, 
  Conversation, 
  SendMessageRequest, 
  CreateConversationRequest,
  SendMessageResponse,
  CreateConversationResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  ChatLoadingState,
  ChatError,
  ChatUIState,
  RateLimitInfo
} from '@/types/chat';
import { useAuth } from '@/hooks/use-auth-listener';
import { safeApiCall } from '@/lib/utils/safe-api';

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GeneralChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingState, setLoadingState] = useState<ChatLoadingState>({
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    isCreatingConversation: false,
    isDeletingConversation: false,
  });
  const [uiState, setUIState] = useState<ChatUIState>({
    selectedConversation: null,
    inputValue: '',
    isSidebarOpen: true,
    retryCountdown: 0,
    isFirstMessage: true,
  });
  const [error, setError] = useState<ChatError | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Create new conversation
  const createConversation = useCallback(async (chatType: 'general' | 'study_assistant' = 'general'): Promise<Conversation | null> => {
    if (!user?.id) {
      setError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      return null;
    }

    setLoadingState(prev => ({ ...prev, isCreatingConversation: true }));
    setError(null);

    try {
      const request: CreateConversationRequest = {
        userId: user.id,
        chatType,
      };

      const result = await safeApiCall('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (result.isHtmlResponse) {
        throw new Error('Received HTML response - authentication may be required');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      const data: CreateConversationResponse = result.data;
      const newConversation: Conversation = {
        id: data.data.conversationId,
        title: data.data.title,
        chatType: data.data.chatType as 'general' | 'study_assistant',
        createdAt: data.data.created_at,
        updatedAt: data.data.created_at,
      };

      setConversations(prev => [newConversation, ...prev]);
      setUIState(prev => ({ 
        ...prev, 
        selectedConversation: newConversation,
        isFirstMessage: true,
      }));
      
      return newConversation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'CREATE_CONVERSATION_FAILED', message: errorMessage });
      return null;
    } finally {
      setLoadingState(prev => ({ ...prev, isCreatingConversation: false }));
    }
  }, [user?.id]);

  // Load conversations
  const loadConversations = useCallback(async (chatType?: 'general' | 'study_assistant') => {
    if (!user?.id) return;

    setLoadingState(prev => ({ ...prev, isLoadingConversations: true }));
    setError(null);

    try {
      const params = new URLSearchParams({ userId: user.id });
      if (chatType) params.append('chatType', chatType);

      const result = await safeApiCall(`/api/chat/conversations?${params}`);

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for conversations:', result.error);
        setConversations([]);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to load conversations');
      }

      const data: GetConversationsResponse = result.data;
      setConversations(data.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'LOAD_CONVERSATIONS_FAILED', message: errorMessage });
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingConversations: false }));
    }
  }, [user?.id]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    setLoadingState(prev => ({ ...prev, isLoadingMessages: true }));
    setError(null);

    try {
      const result = await safeApiCall(`/api/chat/messages?conversationId=${conversationId}`);

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for messages:', result.error);
        setMessages([]);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }

      const data: GetMessagesResponse = result.data;
      const transformedMessages: GeneralChatMessage[] = data.data.messages.map(msg => ({
        ...msg,
        isLoading: false,
        isError: false,
      }));

      setMessages(transformedMessages);
      setUIState(prev => ({
        ...prev,
        selectedConversation: {
          id: data.data.conversation.id,
          title: data.data.conversation.title,
          chatType: data.data.conversation.chatType as 'general' | 'study_assistant',
          createdAt: data.data.conversation.createdAt,
          updatedAt: data.data.conversation.updatedAt,
          messageCount: data.data.messages.length
        },
        isFirstMessage: data.data.messages.length === 0,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'LOAD_MESSAGES_FAILED', message: errorMessage });
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingMessages: false }));
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: string, conversationId?: string) => {
    if (!user?.id) {
      setError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    if (!message.trim()) return;

    // Check rate limiting
    if (rateLimitInfo?.isLimited && rateLimitInfo.retryAfter) {
      setUIState(prev => ({ ...prev, retryCountdown: Math.max(0, rateLimitInfo.retryAfter || 0) }));
      setError({ 
        code: 'RATE_LIMITED', 
        message: `High traffic! Please wait ${rateLimitInfo.retryAfter} seconds before next message.`,
        retryAfter: rateLimitInfo.retryAfter
      });
      return;
    }

    setLoadingState(prev => ({ ...prev, isSendingMessage: true }));
    setError(null);

    try {
      // Get or create conversation
      let currentConversationId = conversationId;
      
      if (!currentConversationId) {
        const newConversation = await createConversation('general');
        if (!newConversation) return;
        currentConversationId = newConversation.id;
      }

      // Add user message immediately
      const userMessage: GeneralChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setUIState(prev => ({ 
        ...prev, 
        inputValue: '',
        isFirstMessage: false,
      }));

      // Add loading message
      const loadingMessage: GeneralChatMessage = {
        id: `loading-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      // Send to backend
      const request: SendMessageRequest = {
        // userId omitted; derived server-side
        conversationId: currentConversationId,
        message: message.trim(),
        chatType: 'general',
      };

      const result = await safeApiCall('/api/chat/general/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for send message:', result.error);
        setError({ 
          code: 'SERVICE_UNAVAILABLE', 
          message: 'Received HTML response - please check authentication' 
        });
        return;
      }

      if (!result.success) {
        // Check for rate limiting in error response
        if (result.error?.includes('429') || result.error?.includes('rate limit')) {
          const retryAfter = 60; // Default to 60 seconds
          setRateLimitInfo({ 
            isLimited: true, 
            retryAfter, 
            limitType: 'user' 
          });
          setError({
            code: 'RATE_LIMITED',
            message: `High traffic! Please wait ${retryAfter} seconds before next message.`,
            retryAfter
          });
        } else {
          setError({
            code: 'SEND_MESSAGE_FAILED',
            message: result.error || 'Failed to send message'
          });
        }
        return;
      }

      const data: SendMessageResponse = result.data;

      // Add AI response
      const aiMessage: GeneralChatMessage = {
        id: data.data.response.isTimeSensitive ? `time-sensitive-${Date.now()}` : `ai-${Date.now()}`,
        role: 'assistant',
        content: data.data.response.content,
        timestamp: data.data.timestamp,
        provider: data.data.response.provider_used,
        model: data.data.response.model_used,
        tokensUsed: data.data.response.tokens_used.input + data.data.response.tokens_used.output,
        latencyMs: data.data.response.latency_ms,
        isTimeSensitive: data.data.response.isTimeSensitive,
        webSearchUsed: data.data.response.web_search_enabled,
        cached: data.data.response.cached,
        language: data.data.response.language,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update conversation list
      await loadConversations('general');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'SEND_MESSAGE_FAILED', message: errorMessage });
      
      // Remove loading message on error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    } finally {
      setLoadingState(prev => ({ ...prev, isSendingMessage: false }));
    }
  }, [user?.id, createConversation, loadConversations, rateLimitInfo?.isLimited]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    setLoadingState(prev => ({ ...prev, isDeletingConversation: true }));
    setError(null);

    try {
      const result = await safeApiCall(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for delete conversation:', result.error);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete conversation');
      }

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear messages if this conversation was selected
      if (uiState.selectedConversation?.id === conversationId) {
        setMessages([]);
        setUIState(prev => ({ ...prev, selectedConversation: null, isFirstMessage: true }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'DELETE_CONVERSATION_FAILED', message: errorMessage });
    } finally {
      setLoadingState(prev => ({ ...prev, isDeletingConversation: false }));
    }
  }, [user?.id, uiState.selectedConversation?.id]);

  // Start new chat
  const startNewChat = useCallback(async () => {
    const newConversation = await createConversation('general');
    if (newConversation) {
      setMessages([]);
      setUIState(prev => ({ 
        ...prev, 
        selectedConversation: newConversation,
        isFirstMessage: true,
      }));
    }
  }, [createConversation]);

  // Select conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    await loadMessages(conversation.id);
  }, [loadMessages]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setRateLimitInfo(null);
    setUIState(prev => ({ ...prev, retryCountdown: 0 }));
  }, []);

  // Handle input change
  const setInputValue = useCallback((value: string) => {
    setUIState(prev => ({ ...prev, inputValue: value }));
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  }, []);

  // Initialize - load conversations when user is available
  useEffect(() => {
    if (user?.id) {
      loadConversations('general');
    }
  }, [user?.id, loadConversations]);

  // Rate limit countdown
  useEffect(() => {
    if (uiState.retryCountdown > 0) {
      const timer = setTimeout(() => {
        setUIState(prev => ({ ...prev, retryCountdown: prev.retryCountdown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (uiState.retryCountdown === 0 && rateLimitInfo?.isLimited) {
      setRateLimitInfo(null);
      clearError();
    }
  }, [uiState.retryCountdown, rateLimitInfo?.isLimited, clearError]);

  return {
    // Data
    messages,
    conversations,
    user,
    
    // State
    loadingState,
    uiState,
    error,
    rateLimitInfo,
    
    // Actions
    createConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    deleteConversation,
    startNewChat,
    selectConversation,
    clearError,
    setInputValue,
    toggleSidebar,
    
    // Refs
    messagesEndRef,
    
    // Computed
    currentConversation: uiState.selectedConversation,
    canSendMessage: !loadingState.isSendingMessage && 
                   !rateLimitInfo?.isLimited && 
                   uiState.inputValue.trim().length > 0,
    characterCount: uiState.inputValue.length,
    maxCharacters: 500,
    isOverLimit: uiState.inputValue.length > 500,
  };
}
