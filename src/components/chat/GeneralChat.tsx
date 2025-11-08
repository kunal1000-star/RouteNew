"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageCircle, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/supabase';
import { safeApiCall } from '@/lib/utils/safe-api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import RichContent from '@/components/chat/RichContent';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ui/theme-toggle';
import { exponentialBackoffRetry } from '@/lib/utils/retry';
import StreamControls from '@/components/ui/stream-controls';
import AlertBanner from '@/components/ui/alert-banner';
import { AIFeaturesEngine } from '@/lib/ai/ai-features-engine';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart3,
  Target,
  TrendingUp,
  Brain,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Activity,
  BookOpen,
  Star
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model_used?: string;
  provider_used?: string;
  tokens_used?: number;
  latency_ms?: number;
  cached?: boolean;
  web_search_enabled?: boolean;
}

interface ChatConversation {
  id: string;
  title: string;
  chat_type: 'general' | 'study_assistant';
  created_at: string;
  updated_at: string;
}

interface GeneralChatProps {
  className?: string;
  userId?: string;
}

export default function GeneralChat({ className }: GeneralChatProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [streamCompleted, setStreamCompleted] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [errorBanner, setErrorBanner] = useState<{visible:boolean; message:string; lastPrompt?:string} | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [aiFeaturesActive, setAiFeaturesActive] = useState(false);
  const [aiFeaturesData, setAiFeaturesData] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize user authentication
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          setIsAuthenticated(true);
          console.log('✅ User authenticated:', user.id);
        } else {
          setIsAuthenticated(false);
          console.log('❌ No authenticated user found');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setIsAuthenticated(false);
      }
    };
    initializeUser();

    // Auto-retry when back online if there is a stored last prompt
    const onOnline = () => {
      if (errorBanner?.visible && errorBanner.lastPrompt) {
        setInputMessage(errorBanner.lastPrompt);
        setErrorBanner(null);
        setTimeout(() => sendMessage(), 0);
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Ctrl/Cmd+K to focus input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadConversations();
    }
  }, [isAuthenticated, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else setShowJump(true);
  }, [messages, autoScroll]);

  const loadConversations = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingConversations(true);
      console.log('🔍 Loading conversations for user:', userId);
      
      const result = await safeApiCall(`/api/chat/conversations?userId=${userId}&chatType=general`);
      
      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for conversations:', result.error);
        setConversations([]);
        return;
      }
      
      if (!result.success) {
        console.error('❌ Failed to load conversations:', result.error);
        setConversations([]);
        return;
      }
      
      const data = result.data;
      console.log('📋 Conversations loaded:', data);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await safeApiCall(`/api/chat/messages?conversationId=${conversationId}`);
      
      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for messages:', result.error);
        setMessages([]);
        return;
      }
      
      if (!result.success) {
        console.error('❌ Failed to load messages:', result.error);
        setMessages([]);
        return;
      }
      
      const data = result.data;
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const startNewConversation = async () => {
    if (!userId) {
      console.log('❌ Cannot create conversation - no authenticated user');
      return;
    }

    try {
      console.log('🔄 Creating new conversation...');
      
      const result = await safeApiCall('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          chatType: 'general',
          title: 'New Chat'
        })
      });
      
      if (!result.success) {
        console.error('❌ Failed to create conversation:', result.error);
        return;
      }
      
      const data = result.data;
      if (data.conversation) {
        console.log('✅ Conversation created:', data.conversation);
        setCurrentConversation(data.conversation);
        setMessages([]);
        setSidebarOpen(false);
        setConversations(prev => [data.conversation, ...prev]);
        inputRef.current?.focus();
      } else {
        console.error('❌ Failed to create conversation:', data);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const selectConversation = (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !userId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('💬 Sending message in General Chat...');
      
      // Start streaming from SSE-like endpoint (POST streaming)
      const controller = new AbortController();
      streamAbortRef.current = controller;
      setIsStreaming(true);
      setStreamCompleted(false);
      const res = await exponentialBackoffRetry(() => fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, conversationId: currentConversation?.id }),
        signal: controller.signal,
      }), { retries: 2, baseDelayMs: 400, maxDelayMs: 2000, jitter: true, signal: controller.signal });
      if (!res.body) throw new Error('No stream body');

      // Create assistant placeholder
      const aiMsgId = `ai-${Date.now()}`;
      setCurrentStreamingMessageId(aiMsgId);
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true, streaming: true }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const append = (chunk: string) => {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m));
      };
      let ended = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          try {
            const evt = JSON.parse(payload);
            // diagnostics: track per-message event sequence and a timeout
            // store on window to persist across closures in this handler
            const w: any = typeof window !== 'undefined' ? window : {};
            w.__chatSeq = w.__chatSeq || {};
            w.__chatTimers = w.__chatTimers || {};
            if (!w.__chatSeq[aiMsgId]) w.__chatSeq[aiMsgId] = [];
            w.__chatSeq[aiMsgId].push(evt.type);

            if (evt.type === 'start') {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isLoading: true, streaming: true } : m));
              // start a 12s timeout to guard against stuck loading
              if (!w.__chatTimers[aiMsgId]) {
                w.__chatTimers[aiMsgId] = setTimeout(() => {
                  console.warn('GeneralChat timeout without content/end', { seq: w.__chatSeq[aiMsgId] });
                  setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                    ...m,
                    isLoading: false,
                    streaming: false,
                    content: m.content && m.content.length > 0 ? m.content : 'Response timed out. Please try again.'
                  } : m));
                  delete w.__chatTimers[aiMsgId];
                }, 12000);
              }
            }
            if (evt.type === 'content' && typeof evt.data === 'string') {
              // first chunk: flip off loading
              if (w.__chatTimers[aiMsgId]) { clearTimeout(w.__chatTimers[aiMsgId]); delete w.__chatTimers[aiMsgId]; }
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isLoading: false } : m));
              append(evt.data);
            }
            if (evt.type === 'metadata') {
              // ensure we don’t keep spinner if provider only sends metadata
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isLoading: false } : m));
            }
            if (evt.type === 'end') {
              ended = true;
              if (w.__chatTimers[aiMsgId]) { clearTimeout(w.__chatTimers[aiMsgId]); delete w.__chatTimers[aiMsgId]; }
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                streaming: false,
                isLoading: false,
                content: m.content && m.content.length > 0 ? m.content : 'I couldn\'t generate a response this time. Please try again.'
              } : m));
              if (w.__chatSeq[aiMsgId] && !w.__chatSeq[aiMsgId].includes('content')) {
                console.warn('GeneralChat ended without content', { seq: w.__chatSeq[aiMsgId] });
              }
              delete w.__chatSeq[aiMsgId];
            }
            if (evt.type === 'error') {
              if (w.__chatTimers[aiMsgId]) { clearTimeout(w.__chatTimers[aiMsgId]); delete w.__chatTimers[aiMsgId]; }
              throw new Error(evt.error?.message || 'Stream error');
            }
          } catch {}
        }
      }

      setIsStreaming(false);
      setStreamCompleted(true);
      setCurrentStreamingMessageId(null);
      // After stream finishes, persist via normal API (best-effort)
      exponentialBackoffRetry(() => safeApiCall('/api/chat/general/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, conversationId: currentConversation?.id, message: messageText, chatType: 'general' })
      }), { retries: 2, baseDelayMs: 500, maxDelayMs: 2500 }).catch(() => {/* ignore */});

      setErrorBanner(null);
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setErrorBanner({ visible: true, message: (error instanceof Error ? error.message : 'Failed to get response'), lastPrompt: messageText });
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamAbortRef.current = null;
      setCurrentStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateAIInsights = async () => {
    if (!userId || isGeneratingInsights) return;
    
    setIsGeneratingInsights(true);
    try {
      console.log('🧠 Generating AI insights for user:', userId);
      
      const result = await safeApiCall('/api/features/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureIds: [1, 2, 3, 4, 5, 6], // Performance Analysis features
          userId,
          context: {
            studyData: {
              totalBlocks: 50,
              completedBlocks: 35,
              accuracy: 78
            },
            performanceHistory: [
              { date: '2025-11-01', score: 75 },
              { date: '2025-11-02', score: 82 },
              { date: '2025-11-03', score: 78 }
            ]
          }
        })
      });

      if (!result.success) {
        throw new Error(`AI insights failed: ${result.error}`);
      }
      
      const data = result.data;
      setAiFeaturesData(data);
      setAiFeaturesActive(true);
      console.log('✅ AI insights generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate AI insights:', error);
      // Show user-friendly error message
      toast({
        title: 'AI Insights Unavailable',
        description: `AI insights temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
          <h3 className="font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground mb-4">
            Please sign in to use the AI chat functionality.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h1 className="font-semibold">Ask Anything</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Conversations</h2>
            <Button
              size="sm"
              onClick={startNewConversation}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`
                    p-3 mb-2 cursor-pointer transition-colors hover:bg-accent
                    ${currentConversation?.id === conversation.id ? 'bg-accent border-primary' : ''}
                  `}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate flex-1 mr-2">
                      {conversation.title}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      General
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(conversation.created_at)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          {errorBanner?.visible && (
            <div className="mb-3">
              <AlertBanner
                message={errorBanner.message}
                onRetry={() => {
                  if (errorBanner.lastPrompt) {
                    setInputMessage(errorBanner.lastPrompt);
                    setErrorBanner(null);
                    setTimeout(() => sendMessage(), 0);
                  }
                }}
                onDismiss={() => setErrorBanner(null)}
              />
            </div>
          )}
          <div className="flex items-center gap-2 justify-end">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={autoScroll} onChange={(e)=>setAutoScroll(e.target.checked)} />
                Auto-scroll
              </label>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {currentConversation ? currentConversation.title : 'Ask Anything'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask general study questions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StreamControls
                streaming={isStreaming}
                completed={streamCompleted}
                onStopKeep={() => { streamAbortRef.current?.abort(); setIsStreaming(false); }}
                onStopClear={() => { streamAbortRef.current?.abort(); setIsStreaming(false); if (currentStreamingMessageId) setMessages(prev=>prev.filter(m=>m.id!==currentStreamingMessageId)); }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIInsights}
                disabled={isGeneratingInsights || !userId}
                className="flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {isGeneratingInsights ? 'Analyzing...' : 'AI Insights'}
              </Button>
              {currentConversation && (
                <Badge variant="outline" className="text-xs">
                  General Chat
                </Badge>
              )}
            </div>
          </div>
          
          {/* AI Insights Panel */}
          {aiFeaturesActive && aiFeaturesData && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                AI Performance Analysis
              </h3>
              
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="recommendations">AI Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="performance" className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Accuracy Score</span>
                      </div>
                      <div className="text-2xl font-bold text-green-500 mb-1">78%</div>
                      <Progress value={78} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Based on recent practice</p>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Study Streak</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-500 mb-1">7 Days</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
                    </Card>
                  </div>
                  
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Topic Mastery</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Thermodynamics</span>
                        <span className="text-sm text-green-500">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Organic Chemistry</span>
                        <span className="text-sm text-orange-500">62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Physics - Mechanics</span>
                        <span className="text-sm text-green-500">91%</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Key Insights</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">Strong performance in Physics - Mechanics</p>
                          <p className="text-xs text-muted-foreground">You excel at kinematics and dynamics problems</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">Organic Chemistry needs attention</p>
                          <p className="text-xs text-muted-foreground">Focus on reaction mechanisms and stereochemistry</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">Consistent daily improvement</p>
                          <p className="text-xs text-muted-foreground">Your study streak shows dedication</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">AI Study Recommendations</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">🔥 Today's Priority</p>
                        <p className="text-xs text-muted-foreground">
                          Practice 10 Organic Chemistry reaction mechanisms before your daily review
                        </p>
                      </div>
                      
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">📚 Study Suggestion</p>
                        <p className="text-xs text-muted-foreground">
                          Use visual diagrams for Thermodynamics - they help with concept retention
                        </p>
                      </div>
                      
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">⏰ Optimal Timing</p>
                        <p className="text-xs text-muted-foreground">
                          Your best performance time is 2-4 PM - schedule challenging topics then
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything about your studies, and I'll help you out!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {[
                  "What is entropy in thermodynamics?",
                  "How do I solve quadratic equations?",
                  "Explain Newton's laws of motion",
                  "What is the difference between speed and velocity?"
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4" role="log" aria-live="polite" aria-relevant="additions text">
              {messages.map((message, idx) => {
                const prev = messages[idx - 1];
                const next = messages[idx + 1];
                const isFirstInGroup = !prev || prev.role !== message.role;
                const isLastInGroup = !next || next.role !== message.role;
                return (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] sm:max-w-[70%] rounded-lg p-3
                        ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'}
                      `}
                      role="article"
                      aria-roledescription="chat message"
                    >
                      <div className="text-sm">
                        {message.isLoading ? (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/50 animate-pulse" />
                            <span>Getting response...</span>
                          </div>
                        ) : (
                          <RichContent text={message.content} />
                        )}
                      </div>

                      {message.role === 'assistant' && (
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {message.model_used && <span>Powered by {message.model_used}</span>}
                            {message.latency_ms && <span>• {message.latency_ms}ms</span>}
                            {message.tokens_used && <span>• {message.tokens_used} tokens</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {message.cached && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                From cache
                              </Badge>
                            )}
                            {message.web_search_enabled && (
                              <Badge variant="secondary" className="text-xs">
                                <Search className="h-3 w-3 mr-1" />
                                Live search
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-2 opacity-70">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={async () => { try { await navigator.clipboard.writeText(message.content); } catch {} }}
                          >
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => {
                              const prevUser = [...messages].slice(0, idx).reverse().find(m => m.role === 'user');
                              if (prevUser) {
                                setInputMessage(prevUser.content);
                                setTimeout(() => { sendMessage(); }, 0);
                              }
                            }}
                          >
                            Regenerate
                          </Button>
                        </div>
                      )}

                      <div className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 mr-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span>Getting response...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              disabled={isLoading || !isAuthenticated}
              className="flex-1"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !isAuthenticated}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {showJump && isStreaming && !autoScroll && (
            <div className="flex justify-center mt-2">
              <Button size="sm" variant="secondary" onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); setShowJump(false); }}>
                Jump to latest
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{inputMessage.length}/500</span>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
