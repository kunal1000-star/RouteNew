// Google Drive Save Hook
// ======================
// Custom hook for managing Google Drive save functionality

'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/study-buddy';

interface UseGoogleDriveSaveProps {
  userId?: string;
  conversationId?: string;
}

interface SaveRequest {
  content: {
    type: 'message' | 'conversation' | 'highlighted_text';
    message?: ChatMessage;
    conversation?: ChatMessage[];
    highlightedText?: string;
    context?: {
      conversationId?: string;
      userId?: string;
      subject?: string;
      timestamp?: Date;
    };
  };
  options: {
    fileName: string;
    format: 'txt' | 'pdf' | 'docx' | 'markdown';
    folder: string;
    aiEnhancement: boolean;
    includeMetadata: boolean;
    createSummary: boolean;
    addTags: boolean;
    includeConversationContext: boolean;
  };
  tags: string[];
  notes: string;
}

export function useGoogleDriveSave({ userId, conversationId }: UseGoogleDriveSaveProps = {}) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Save individual message
  const saveMessage = useCallback(async (
    message: ChatMessage,
    options: {
      fileName?: string;
      format?: 'txt' | 'pdf' | 'docx' | 'markdown';
      aiEnhancement?: boolean;
      includeMetadata?: boolean;
    } = {}
  ) => {
    if (!userId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save content to Google Drive.',
        variant: 'destructive'
      });
      return false;
    }

    setIsSaving(true);

    try {
      const saveRequest: SaveRequest = {
        content: {
          type: 'message',
          message,
          context: {
            conversationId,
            userId,
            timestamp: new Date(),
          },
        },
        options: {
          fileName: options.fileName || generateMessageFileName(message),
          format: options.format || 'txt',
          folder: 'StudyBuddy/Messages',
          aiEnhancement: options.aiEnhancement ?? true,
          includeMetadata: options.includeMetadata ?? true,
          createSummary: true,
          addTags: true,
          includeConversationContext: false,
        },
        tags: [],
        notes: '',
      };

      const response = await fetch('/api/google-drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          // In a real app, you'd include the auth tokens here
          'x-drive-auth': JSON.stringify({
            accessToken: 'mock-token', // This would come from secure storage
            refreshToken: 'mock-refresh',
            expiresAt: Date.now() + 3600000, // 1 hour
          }),
        },
        body: JSON.stringify(saveRequest),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      toast({
        title: 'Message saved',
        description: 'Content has been saved to Google Drive with AI enhancement.',
      });

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save content to Google Drive.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, conversationId, toast]);

  // Save entire conversation
  const saveConversation = useCallback(async (
    messages: ChatMessage[],
    options: {
      fileName?: string;
      format?: 'txt' | 'pdf' | 'docx' | 'markdown';
      aiEnhancement?: boolean;
    } = {}
  ) => {
    if (!userId || messages.length === 0) {
      toast({
        title: 'Invalid data',
        description: 'No conversation to save or authentication required.',
        variant: 'destructive'
      });
      return false;
    }

    setIsSaving(true);

    try {
      const saveRequest: SaveRequest = {
        content: {
          type: 'conversation',
          conversation: messages,
          context: {
            conversationId,
            userId,
            timestamp: new Date(),
          },
        },
        options: {
          fileName: options.fileName || generateConversationFileName(messages),
          format: options.format || 'txt',
          folder: 'StudyBuddy/Conversations',
          aiEnhancement: options.aiEnhancement ?? true,
          includeMetadata: true,
          createSummary: true,
          addTags: true,
          includeConversationContext: false,
        },
        tags: [],
        notes: '',
      };

      const response = await fetch('/api/google-drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-drive-auth': JSON.stringify({
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            expiresAt: Date.now() + 3600000,
          }),
        },
        body: JSON.stringify(saveRequest),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      toast({
        title: 'Conversation saved',
        description: 'Entire conversation saved to Google Drive with AI summary.',
      });

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save conversation to Google Drive.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, conversationId, toast]);

  // Save highlighted text
  const saveHighlightedText = useCallback(async (
    text: string,
    options: {
      fileName?: string;
      format?: 'txt' | 'pdf' | 'docx' | 'markdown';
      aiEnhancement?: boolean;
      notes?: string;
    } = {}
  ) => {
    if (!userId || !text.trim()) {
      toast({
        title: 'Invalid data',
        description: 'No text to save or authentication required.',
        variant: 'destructive'
      });
      return false;
    }

    setIsSaving(true);

    try {
      const saveRequest: SaveRequest = {
        content: {
          type: 'highlighted_text',
          highlightedText: text,
          context: {
            conversationId,
            userId,
            timestamp: new Date(),
          },
        },
        options: {
          fileName: options.fileName || generateHighlightFileName(),
          format: options.format || 'txt',
          folder: 'StudyBuddy/Highlights',
          aiEnhancement: options.aiEnhancement ?? true,
          includeMetadata: true,
          createSummary: false,
          addTags: true,
          includeConversationContext: false,
        },
        tags: [],
        notes: options.notes || '',
      };

      const response = await fetch('/api/google-drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-drive-auth': JSON.stringify({
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            expiresAt: Date.now() + 3600000,
          }),
        },
        body: JSON.stringify(saveRequest),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      toast({
        title: 'Text saved',
        description: 'Highlighted text saved to Google Drive.',
      });

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save text to Google Drive.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, conversationId, toast]);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/google-drive/auth', {
        method: 'GET',
        headers: {
          'x-user-id': userId,
        },
      });

      const result = await response.json();
      const isConnected = result.success && result.data?.isConnected;
      
      setAuthStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus('disconnected');
      return false;
    }
  }, [userId]);

  return {
    isSaving,
    authStatus,
    saveMessage,
    saveConversation,
    saveHighlightedText,
    checkAuthStatus,
  };
}

// Helper functions
function generateMessageFileName(message: ChatMessage): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const preview = message.content.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
  return `message_${preview}_${timestamp}.txt`;
}

function generateConversationFileName(messages: ChatMessage[]): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const count = messages.length;
  return `conversation_${count}msgs_${timestamp}.txt`;
}

function generateHighlightFileName(): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  return `highlight_${timestamp}.txt`;
}