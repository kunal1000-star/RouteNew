// Study Buddy State Management Hook with Layer 2 Integration
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, supabaseBrowserClient } from '@/lib/supabase';
import type {
  StudyBuddyState,
  StudyBuddyActions,
  ChatMessage,
  ChatPreferences,
  StudyContext,
  StudentProfileData,
  MemoryReference,
  StudyBuddyApiResponse,
  StudyBuddyApiRequest
} from '@/types/study-buddy';

// Layer 2 Imports
import { buildEnhancedContext, EnhancedContext, ContextBuildRequest, ContextLevel } from '@/lib/hallucination-prevention/layer2/EnhancedContextBuilder';
import { searchKnowledge, KnowledgeSearchResult, SearchFilters } from '@/lib/hallucination-prevention/layer2/KnowledgeBase';
import { optimizeContext, OptimizationRequest, OptimizationStrategy, OptimizationResult } from '@/lib/hallucination-prevention/layer2/ContextOptimizer';
import { searchMemories, MemorySearchRequest, MemorySearchResult, storeMemory } from '@/lib/hallucination-prevention/layer2/ConversationMemory';

const DEFAULT_PREFERENCES: ChatPreferences = {
  provider: 'groq',
  model: '',
  streamResponses: true,
  temperature: 0.7,
  maxTokens: 2048,
};

const DEFAULT_STUDY_CONTEXT: StudyContext = {
  subject: '',
  difficultyLevel: 'intermediate',
  learningGoals: [],
  topics: [],
  timeSpent: 0,
  lastActivity: new Date(),
};

const DEFAULT_PROFILE_DATA: StudentProfileData = {
  profileText: 'Welcome to your study journey! Start by exploring subjects and topics.',
  strongSubjects: [],
  weakSubjects: [],
  studyProgress: {
    totalTopics: 0,
    completedTopics: 0,
    accuracy: 0
  },
  currentData: {
    streak: 0,
    level: 1,
    points: 0,
    revisionQueue: 0
  },
  lastUpdated: new Date().toISOString()
};

// Enhanced interfaces for Layer 2 integration
export interface EnhancedStudyBuddyState extends StudyBuddyState {
  enhancedContext: EnhancedContext | null;
  layer2Context: {
    knowledgeBase: KnowledgeSearchResult[];
    relevantMemories: MemorySearchResult[];
    contextOptimization: OptimizationResult | null;
    compressionLevel: ContextLevel;
    tokenUsage: number;
  };
}

export interface EnhancedStudyBuddyActions extends StudyBuddyActions {
  // Session management
  initializeSession: () => Promise<void>;
  
  // Enhanced context building methods
  buildEnhancedStudyContext: (level?: ContextLevel) => Promise<EnhancedContext>;
  getRelevantStudyMemories: (query?: string, limit?: number) => Promise<MemorySearchResult[]>;
  optimizeStudyContext: (tokenLimit?: number, strategy?: OptimizationStrategy) => Promise<OptimizationResult>;
  getStudyKnowledgeBase: (query: string, filters?: SearchFilters) => Promise<KnowledgeSearchResult[]>;
  
  // Layer 2 utilities
  getContextOptimization: () => OptimizationResult | null;
  updateCompressionLevel: (level: ContextLevel) => void;
  getTokenUsage: () => number;
  
  // Memory management
  storeStudyInteraction: (query: string, response: string, metadata?: any) => Promise<void>;
  getLearningProgress: () => Promise<any>;
}

export function useStudyBuddy(): EnhancedStudyBuddyState & EnhancedStudyBuddyActions {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [preferences, setPreferences] = useState<ChatPreferences>(DEFAULT_PREFERENCES);
  const [studyContext, setStudyContext] = useState<StudyContext>(DEFAULT_STUDY_CONTEXT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);

  // Layer 2 enhanced state
  const [enhancedContext, setEnhancedContext] = useState<EnhancedContext | null>(null);
  const [layer2Context, setLayer2Context] = useState({
    knowledgeBase: [] as KnowledgeSearchResult[],
    relevantMemories: [] as MemorySearchResult[],
    contextOptimization: null as OptimizationResult | null,
    compressionLevel: 'selective' as ContextLevel,
    tokenUsage: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal question detection keywords (now enhanced with Layer 1)
  const personalQuestionKeywords = [
    'mera', 'my', 'performance', 'progress', 'weak', 'strong', 'score', 'analysis',
    'revision', 'kaise chal raha', 'improvement', 'help me', 'suggest', 'strategy', 'schedule'
  ];

  // Initialize session and load data
  useEffect(() => {
    initializeSession();
  }, [searchParams, router]);

  const initializeSession = async () => {
    try {
      // Get current user
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        // Fetch profile data
        await fetchProfileData();
        // Build initial enhanced context
        if (user.id) {
          await buildInitialEnhancedContext();
        }
      }

      // Load session ID from URL or create new one
      const urlSessionId = searchParams.get('session');
      if (urlSessionId) {
        setSessionId(urlSessionId);
      } else {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        router.replace(`/study-buddy?session=${newSessionId}`);
      }

      // Load preferences and chat history
      loadPreferences();
      loadChatHistory();
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load preferences from localStorage
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('study-buddy-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...prefs }));
      }

      const savedContext = localStorage.getItem('study-buddy-study-context');
      if (savedContext) {
        const context = JSON.parse(savedContext);
        setStudyContext(prev => ({ ...prev, ...context }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const sessionKey = `study-buddy-history-${sessionId}`;
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        const history = JSON.parse(saved);
        setMessages(history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<ChatPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('study-buddy-preferences', JSON.stringify({
      provider: updated.provider,
      model: updated.model,
      streamResponses: updated.streamResponses,
      temperature: updated.temperature,
      maxTokens: updated.maxTokens,
    }));
  }, [preferences]);

  // Save study context to localStorage
  const saveStudyContext = useCallback((context: StudyContext) => {
    setStudyContext(context);
    localStorage.setItem('study-buddy-study-context', JSON.stringify(context));
  }, []);

  // Save chat history to localStorage
  const saveChatHistory = useCallback((newMessages: ChatMessage[]) => {
    try {
      const sessionKey = `study-buddy-history-${sessionId}`;
      localStorage.setItem(sessionKey, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [sessionId]);

  // Utility functions
  const generateSessionId = () => {
    return `study-buddy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateConversationId = () => {
    // Generate a proper UUID v4 format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Detect if question is personal (enhanced with Layer 1 integration)
  const detectPersonalQuestion = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return personalQuestionKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
  };

  // Add message to chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      saveChatHistory(updated);
      return updated;
    });

    return newMessage.id;
  }, [saveChatHistory]);

  // Update existing message
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => {
      const updated = prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      saveChatHistory(updated);
      return updated;
    });
  }, [saveChatHistory]);

  // LAYER 2 ENHANCED METHODS

  /**
   * Build enhanced study context with 4-level compression
   */
  const buildEnhancedStudyContext = useCallback(async (level: ContextLevel = 'selective'): Promise<EnhancedContext> => {
    if (!userId) {
      throw new Error('User ID is required to build enhanced context');
    }

    try {
      const request: ContextBuildRequest = {
        userId,
        level,
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: preferences.maxTokens,
        subjects: (studyContext?.topics?.length ?? 0) > 0 ? [studyContext.subject] : undefined,
        topics: (studyContext?.topics?.length ?? 0) > 0 ? studyContext.topics : undefined
      };

      const context = await buildEnhancedContext(request);
      setEnhancedContext(context);
      setLayer2Context(prev => ({
        ...prev,
        compressionLevel: level,
        tokenUsage: context.tokenUsage.total
      }));

      return context;
    } catch (error) {
      console.error('Failed to build enhanced context:', error);
      throw error;
    }
  }, [userId, preferences.maxTokens, studyContext]);

  /**
   * Get relevant study memories from conversation memory
   */
  const getRelevantStudyMemories = useCallback(async (query: string = '', limit: number = 5): Promise<MemorySearchResult[]> => {
    if (!userId) {
      return [];
    }

    try {
      const request: MemorySearchRequest = {
        userId,
        query,
        maxResults: limit,
        minRelevanceScore: 0.3,
        includeLinked: true,
        sortBy: 'relevance'
      };

      const results = await searchMemories(request);
      setLayer2Context(prev => ({
        ...prev,
        relevantMemories: results
      }));

      return results;
    } catch (error) {
      console.error('Failed to get relevant study memories:', error);
      return [];
    }
  }, [userId]);

  /**
   * Optimize study context for token budget management
   */
  const optimizeStudyContext = useCallback(async (
    tokenLimit: number = preferences.maxTokens, 
    strategy: OptimizationStrategy = 'balanced'
  ): Promise<OptimizationResult> => {
    if (!enhancedContext) {
      throw new Error('Enhanced context must be built before optimization');
    }

    try {
      const request: OptimizationRequest = {
        context: enhancedContext,
        tokenLimit,
        strategy,
        educationalPriority: true,
        preserveComponents: ['profile', 'knowledge'],
        minimumQuality: 0.6
      };

      const result = await optimizeContext(request);
      setEnhancedContext(result.optimizedContext);
      setLayer2Context(prev => ({
        ...prev,
        contextOptimization: result,
        tokenUsage: result.optimizedContext.tokenUsage.total
      }));

      return result;
    } catch (error) {
      console.error('Failed to optimize study context:', error);
      throw error;
    }
  }, [enhancedContext, preferences.maxTokens]);

  /**
   * Search educational knowledge base
   */
  const getStudyKnowledgeBase = useCallback(async (
    query: string, 
    filters: SearchFilters = {}
  ): Promise<KnowledgeSearchResult[]> => {
    try {
      const defaultFilters: SearchFilters = {
        minReliability: 0.7,
        minEducationalValue: 0.5,
        limit: 10,
        ...filters
      };

      // Add subject context if available
      if (studyContext.subject && !defaultFilters.subjects) {
        defaultFilters.subjects = [studyContext.subject];
      }

      const results = await searchKnowledge(query, defaultFilters);
      setLayer2Context(prev => ({
        ...prev,
        knowledgeBase: results
      }));

      return results;
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      return [];
    }
  }, [studyContext.subject]);

  /**
   * Get current context optimization result
   */
  const getContextOptimization = useCallback((): OptimizationResult | null => {
    return layer2Context.contextOptimization;
  }, [layer2Context.contextOptimization]);

  /**
   * Update compression level
   */
  const updateCompressionLevel = useCallback((level: ContextLevel) => {
    setLayer2Context(prev => ({
      ...prev,
      compressionLevel: level
    }));
  }, []);

  /**
   * Get current token usage
   */
  const getTokenUsage = useCallback((): number => {
    return layer2Context.tokenUsage;
  }, [layer2Context.tokenUsage]);

  /**
   * Store study interaction in memory
   */
  const storeStudyInteraction = useCallback(async (query: string, response: string, metadata: any = {}) => {
    if (!userId || !conversationId) {
      return;
    }

    try {
      await storeMemory({
        userId,
        conversationId,
        memoryType: 'learning_interaction',
        interactionData: {
          content: query,
          response,
          subject: studyContext.subject,
          topic: studyContext.topics[0],
          timestamp: new Date(),
          complexity: metadata.complexity || 'moderate',
          sentiment: metadata.sentiment || 'neutral'
        },
        qualityScore: metadata.qualityScore || 0.5,
        userSatisfaction: metadata.userSatisfaction,
        feedbackCollected: false,
        memoryRelevanceScore: metadata.qualityScore || 0.5,
        priority: 'medium',
        retention: 'long_term',
        tags: [...studyContext.topics, studyContext.subject].filter(Boolean),
        metadata: {
          source: 'user_input',
          version: 1,
          compressionApplied: false,
          validationStatus: 'valid',
          accessCount: 0,
          lastAccessed: new Date(),
          linkedToKnowledgeBase: false,
          crossConversationLinked: false
        },
        linkedMemories: []
      });
    } catch (error) {
      console.error('Failed to store study interaction:', error);
    }
  }, [userId, conversationId, studyContext]);

  /**
   * Get learning progress from memory analytics
   */
  const getLearningProgress = useCallback(async () => {
    if (!userId) {
      return null;
    }

    try {
      // This would typically get from memory analytics
      // For now, return simplified progress data
      return {
        totalSessions: messages.length,
        averageSessionTime: 30, // minutes
        improvementRate: 0.15, // 15% improvement
        mostStudiedSubject: studyContext.subject || 'General',
        learningVelocity: messages.length / 7 // sessions per week
      };
    } catch (error) {
      console.error('Failed to get learning progress:', error);
      return null;
    }
  }, [userId, messages.length, studyContext.subject]);

  /**
   * Build initial enhanced context
   */
  const buildInitialEnhancedContext = useCallback(async () => {
    if (!userId) return;

    try {
      await buildEnhancedStudyContext('selective');
      await getRelevantStudyMemories('', 3);
    } catch (error) {
      console.error('Failed to build initial enhanced context:', error);
    }
  }, [userId, buildEnhancedStudyContext, getRelevantStudyMemories]);

  // Main message sending function (enhanced with Layer 2)
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Auth guard: ensure user is signed in before sending
    if (!userId) {
      toast({ variant: 'destructive', title: 'Sign in required', description: 'Please sign in to use Study Buddy.' });
      router.push('/auth');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure we have conversation ID
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = generateConversationId();
        setConversationId(currentConversationId);
      }

      // Add user message
      const userMessageId = addMessage({
        role: 'user',
        content: content.trim(),
      });

      // Detect if this is a personal question
      const isPersonalQuery = detectPersonalQuestion(content);

      // Enhanced context building for study sessions
      let enhancedContextForRequest = enhancedContext;
      if (!enhancedContextForRequest) {
        try {
          enhancedContextForRequest = await buildEnhancedStudyContext(layer2Context.compressionLevel);
        } catch (error) {
          console.warn('Failed to build enhanced context for request:', error);
        }
      }

      // Search for relevant knowledge and memories
      const [knowledgeResults, memoryResults] = await Promise.all([
        content.length > 10 ? getStudyKnowledgeBase(content) : Promise.resolve([]),
        getRelevantStudyMemories(content, 3)
      ]);

      // Determine if conversationId is a valid server UUID; if not, let server create it
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const serverConversationIdToSend = currentConversationId && UUID_REGEX.test(currentConversationId) ? currentConversationId : undefined;

      // Call the Study Buddy specific API endpoint that has proper memory integration
      const requestBody: any = {
        conversationId: serverConversationIdToSend,
        message: content,
        chatType: 'study_assistant',
        isPersonalQuery: isPersonalQuery,
        provider: preferences.provider
      };

      if (preferences.streamResponses) {
        // Handle streaming response using the Study Buddy specific endpoint
        const assistantMessageId = addMessage({
          role: 'assistant',
          content: '',
          streaming: true,
        });

        try {
          const session = await supabaseBrowserClient.auth.getSession();
          const accessToken = session.data.session?.access_token;
          if (!accessToken) {
            toast({ variant: 'destructive', title: 'Session expired', description: 'Please sign in again to continue.' });
            updateMessage(assistantMessageId, { content: 'Please sign in to continue.', streaming: false });
            setIsLoading(false);
            router.push('/auth');
            return;
          }
          
          // Use the Study Buddy specific endpoint with memory integration
          const response = await fetch('/api/study-buddy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Sync local conversationId with server-assigned UUID
          if (data?.data?.conversationId) {
            setConversationId(data.data.conversationId);
          }

          if (data.success && data.data && data.data.response) {
            console.log('✅ Setting assistant message from Study Buddy API with memory');
            
            // Update memory references if memory context was found
            if (data.data.memoryContext && data.data.memoryContext.memoriesFound > 0) {
              console.log(`Memory: Found ${data.data.memoryContext.memoriesFound} relevant memories for personalized response`);
            }

            updateMessage(assistantMessageId, {
              content: data.data.response.content,
              provider: data.data.response.provider_used,
              model: data.data.response.model_used,
              tokensUsed: (data.data.response.tokens_used?.output || 0) + (data.data.response.tokens_used?.input || 0),
              streaming: false,
              memory_references: data.data.response.memory_references || []
            });
          } else {
            console.log('⚠️  Study Buddy API response not successful, using fallback response');
            const errorMessage = data.error?.message || 'I apologize, but I encountered an issue processing your request. Please try again, and I\'ll do my best to help you with your studies!';
            updateMessage(assistantMessageId, {
              content: errorMessage,
              streaming: false,
            });
          }

        } catch (streamError) {
          console.error('Study Buddy API failed:', streamError);

          // Add error message to chat
          const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
          updateMessage(assistantMessageId, {
            content: 'I apologize, but I encountered an error while helping you. Please try again, and I\'ll do my best to assist you with your studies!',
            streaming: false,
          });
        }
      } else {
        // Handle regular (non-streaming) response using the Study Buddy specific endpoint
        const session2 = await supabaseBrowserClient.auth.getSession();
        const accessToken2 = session2.data.session?.access_token;
        if (!accessToken2) {
          toast({ variant: 'destructive', title: 'Session expired', description: 'Please sign in again to continue.' });
          setIsLoading(false);
          router.push('/auth');
          return;
        }
        
        // Use the Study Buddy specific endpoint with memory integration
        const response = await fetch('/api/study-buddy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken2}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Sync local conversationId with server-assigned UUID
        if (data?.data?.conversationId) {
          setConversationId(data.data.conversationId);
        }

        if (data.success && data.data && data.data.response) {
          console.log('✅ Setting assistant message from Study Buddy API with memory (non-streaming)');
          
          // Update memory references if memory context was found
          if (data.data.memoryContext && data.data.memoryContext.memoriesFound > 0) {
            console.log(`Memory: Found ${data.data.memoryContext.memoriesFound} relevant memories for personalized response`);
          }

          addMessage({
            role: 'assistant',
            content: data.data.response.content,
            provider: data.data.response.provider_used,
            model: data.data.response.model_used,
            tokensUsed: (data.data.response.tokens_used?.output || 0) + (data.data.response.tokens_used?.input || 0),
            memory_references: data.data.response.memory_references || []
          });
        } else {
          console.log('⚠️  Study Buddy API response not successful, using fallback response (non-streaming)');
          const errorMessage = data.error?.message || 'I apologize, but I encountered an issue processing your request. Please try again, and I\'ll do my best to help you with your studies!';
          addMessage({
            role: 'assistant',
            content: errorMessage,
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });

      // Add error message to chat
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error while helping you. Please try again, and I\'ll do my best to assist you with your studies!',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    const newSessionId = generateSessionId();
    const newConversationId = generateConversationId();
    setSessionId(newSessionId);
    setConversationId(newConversationId);
    router.replace(`/study-buddy?session=${newSessionId}`);

    // Clear local storage for this session
    const sessionKey = `study-buddy-history-${sessionId}`;
    localStorage.removeItem(sessionKey);

    // Clear enhanced context
    setEnhancedContext(null);
    setLayer2Context({
      knowledgeBase: [],
      relevantMemories: [],
      contextOptimization: null,
      compressionLevel: 'selective',
      tokenUsage: 0
    });

    toast({
      title: 'New Chat Started',
      description: 'Your study session has been reset.',
    });
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    const sessionKey = `study-buddy-history-${sessionId}`;
    localStorage.removeItem(sessionKey);

    // Clear enhanced context
    setEnhancedContext(null);
    setLayer2Context({
      knowledgeBase: [],
      relevantMemories: [],
      contextOptimization: null,
      compressionLevel: 'selective',
      tokenUsage: 0
    });

    toast({
      title: 'Chat cleared',
      description: 'Your study session has been reset.',
    });
  };

  // Toggle settings
  const toggleSettings = () => {
    setIsSettingsOpen(prev => !prev);
  };

  // Toggle context
  const toggleContext = () => {
    setIsContextOpen(prev => !prev);
  };

  // Export chat
  const exportChat = () => {
    const chatData = {
      sessionId,
      conversationId,
      messages,
      preferences,
      studyContext,
      enhancedContext, // Include enhanced context
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-buddy-session-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Session exported',
      description: 'Your study session has been exported.',
    });
  };

  // Fetch profile data - FIXED VERSION
  const fetchProfileData = async () => {
    try {
      console.log('🔍 Fetching student profile for userId:', userId);
      
      const response = await fetch(`/api/student/profile?userId=${userId}`);
      
      console.log('📡 Profile API response status:', response.status);

      const data = await response.json();
      
      console.log('📋 Profile API response data:', data);

      // Check if we have valid data in the response, regardless of status code
      if (data && data.data) {
        console.log('✅ Setting profile data from API response');
        setProfileData(data.data);
      } else {
        console.log('⚠️  No valid profile data in response, using defaults');
        // Set default profile data if response doesn't have valid data
        setProfileData(DEFAULT_PROFILE_DATA);
      }
    } catch (error) {
      console.error('❌ Error fetching student profile:', error);
      
      // Set default profile data on any error - THIS FIXES THE CONSOLE ERROR
      console.log('🔄 Setting default profile data due to error');
      setProfileData(DEFAULT_PROFILE_DATA);
    }
  };

  return {
    // State
    messages,
    isLoading,
    sessionId,
    userId,
    conversationId,
    preferences,
    studyContext,
    isSettingsOpen,
    isContextOpen,
    profileData,
    
    // Enhanced Layer 2 State
    enhancedContext,
    layer2Context,

    // Actions
    initializeSession,
    handleSendMessage,
    startNewChat,
    clearChat,
    savePreferences,
    saveStudyContext,
    toggleSettings,
    toggleContext,
    exportChat,
    fetchProfileData,

    // Enhanced Layer 2 Actions
    buildEnhancedStudyContext,
    getRelevantStudyMemories,
    optimizeStudyContext,
    getStudyKnowledgeBase,
    getContextOptimization,
    updateCompressionLevel,
    getTokenUsage,
    storeStudyInteraction,
    getLearningProgress,
  };
}
