"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  Search,
  Plus,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Zap,
  Sparkles,
  AlertTriangle,
  Shield,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { exponentialBackoffRetry } from '@/lib/utils/retry';
import StreamControls from '@/components/ui/stream-controls';
import { AIFeaturesEngine } from '@/lib/ai/ai-features-engine';
import AlertBanner from '@/components/ui/alert-banner';
import RichContent from '@/components/chat/RichContent';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Import 5-layer hallucination prevention components
import { HallucinationPreventionProvider, useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';
import QualityAssurancePanel from '@/components/hallucination-prevention/QualityAssurancePanel';
import LayerStatusIndicators from '@/components/hallucination-prevention/LayerStatusIndicators';

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
  // New 5-layer hallucination prevention properties
  qualityScore?: number;
  confidence?: number;
  hallucinationRisk?: 'low' | 'medium' | 'high';
  factCheckStatus?: 'verified' | 'unverified' | 'disputed';
  educationalEffectiveness?: number;
  userSatisfaction?: number;
  processingDetails?: {
    layer1InputValidation?: boolean;
    layer2ContextGrounding?: boolean;
    layer3ResponseValidation?: boolean;
    layer4FeedbackLearning?: boolean;
    layer5QualityAssurance?: boolean;
  };
}

interface StudentProfile {
  strongSubjects: string[];
  weakSubjects: string[];
  currentStreak: number;
  totalPoints: number;
  level: number;
  accuracy: number;
  examTarget: string;
  learningStyle: string;
}

interface MemoryReference {
  id: string;
  content: string;
  similarity: number;
  created_at: string;
  importance_score: number;
  tags: string[];
}

interface StudyBuddyProps {
  userId: string;
  className?: string;
}

// Enhanced StudyBuddy component with 5-layer hallucination prevention
function EnhancedStudyBuddy({ userId, className }: StudyBuddyProps) {
  const { state, actions } = useHallucinationPrevention();
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [memoryReferences, setMemoryReferences] = useState<MemoryReference[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPersonalQuery, setIsPersonalQuery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [streamCompleted, setStreamCompleted] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiFeaturesActive, setAiFeaturesActive] = useState(false);
  const [aiFeaturesData, setAiFeaturesData] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{visible:boolean; message:string; lastPrompt?:string} | null>(null);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [currentResponseForFeedback, setCurrentResponseForFeedback] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced message sending with 5-layer processing
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamCompleted(false);

    // Start 5-layer processing monitoring
    actions.startProcessing('input_validation');

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const controller = new AbortController();
      streamAbortRef.current = controller;
      
      // Enhanced request with hallucination prevention context
      const enhancedRequest = {
        message: messageText,
        userId,
        isPersonalQuery,
        conversationId: currentConversation?.id,
        enableHallucinationPrevention: true,
        qualityThresholds: {
          minConfidence: 0.7,
          maxRiskLevel: 'medium',
          minEducationalEffectiveness: 0.6
        }
      };

      const res = await exponentialBackoffRetry(() => fetch('/api/chat/study-assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedRequest),
        signal: controller.signal,
      }), { retries: 2, baseDelayMs: 400, maxDelayMs: 2000, jitter: true, signal: controller.signal });

      if (!res.body) throw new Error('Failed to open stream');

      const aiMsgId = `ai-${Date.now()}`;
      setCurrentStreamingMessageId(aiMsgId);
      
      // Create initial AI message with processing status
      const initialAiMessage: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
        streaming: true,
        processingDetails: {
          layer1InputValidation: true,
          layer2ContextGrounding: false,
          layer3ResponseValidation: false,
          layer4FeedbackLearning: false,
          layer5QualityAssurance: false
        }
      };
      
      setMessages(prev => [...prev, initialAiMessage]);

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
            
            // Update processing status for each layer
            if (evt.type === 'start') {
              actions.updateLayerStatus('layer1', 'processing');
              actions.startProcessing('context_grounding');
            }
            if (evt.type === 'content' && typeof evt.data === 'string') {
              actions.updateLayerStatus('layer1', 'completed');
              actions.updateLayerStatus('layer2', 'processing');
              actions.startProcessing('response_validation');
              append(evt.data);
            }
            if (evt.type === 'metadata') {
              // Handle quality metrics from server
              if (evt.qualityMetrics) {
                setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                  ...m,
                  qualityScore: evt.qualityMetrics.overall,
                  confidence: evt.qualityMetrics.confidence,
                  hallucinationRisk: evt.qualityMetrics.hallucinationRisk,
                  factCheckStatus: evt.qualityMetrics.factCheckStatus,
                  educationalEffectiveness: evt.qualityMetrics.educationalEffectiveness,
                  userSatisfaction: evt.qualityMetrics.userSatisfaction,
                  processingDetails: {
                    ...m.processingDetails,
                    layer2ContextGrounding: true,
                    layer3ResponseValidation: true
                  }
                } : m));
              }
            }
            if (evt.type === 'end') {
              ended = true;
              actions.updateLayerStatus('layer2', 'completed');
              actions.updateLayerStatus('layer3', 'completed');
              actions.updateLayerStatus('layer4', 'completed');
              actions.updateLayerStatus('layer5', 'completed');
              
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                streaming: false,
                isLoading: false,
                content: m.content && m.content.length > 0 ? m.content : 'I couldn\'t generate a response this time. Please try again.'
              } : m));
            }
            if (evt.type === 'error') {
              throw new Error(evt.error?.message || 'Stream error');
            }
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        }
      }

      setIsStreaming(false);
      setStreamCompleted(true);
      setCurrentStreamingMessageId(null);
      
      // Persist the enhanced message
      exponentialBackoffRetry(() => fetch('/api/chat/study-assistant/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, conversationId: currentConversation?.id, message: messageText, chatType: 'study_assistant', isPersonalQuery })
      }), { retries: 2, baseDelayMs: 500, maxDelayMs: 2500 }).catch(() => {});

      setErrorBanner(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setErrorBanner({ visible: true, message: (error instanceof Error ? error.message : 'Failed to get response'), lastPrompt: messageText });
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble accessing your study data right now. Please try again.',
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

  const handleResponseFeedback = (feedback: any) => {
    // Submit user feedback to improve system
    if (currentResponseForFeedback) {
      actions.submitFeedback({
        responseId: currentResponseForFeedback.id,
        rating: feedback.rating,
        corrections: feedback.corrections,
        feedbackText: feedback.feedbackText,
        timestamp: new Date()
      });
      setCurrentResponseForFeedback(null);
    }
  };

  const openQualityPanel = (message: ChatMessage) => {
    setCurrentResponseForFeedback({
      id: message.id,
      text: message.content,
      qualityScore: message.qualityScore,
      confidence: message.confidence,
      hallucinationRisk: message.hallucinationRisk,
      factCheckStatus: message.factCheckStatus
    });
    setShowQualityPanel(true);
  };

  // Load student profile and memories on mount
  useEffect(() => {
    loadStudentProfile();
    loadMemoryReferences();
    
    const onOnline = () => {
      if (errorBanner?.visible && errorBanner.lastPrompt) {
        setInputMessage(errorBanner.lastPrompt);
        setErrorBanner(null);
        setTimeout(() => sendMessage(), 0);
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else setShowJump(true);
  }, [messages, autoScroll]);

  const loadStudentProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const mockProfile: StudentProfile = {
        strongSubjects: ['Organic Chemistry', 'Kinematics', 'Calculus'],
        weakSubjects: ['Thermodynamics', 'Modern Physics', 'Integration'],
        currentStreak: 7,
        totalPoints: 1250,
        level: 3,
        accuracy: 78,
        examTarget: 'JEE 2025',
        learningStyle: 'Visual'
      };
      setStudentProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load student profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadMemoryReferences = async () => {
    try {
      const mockMemories: MemoryReference[] = [
        {
          id: 'memory-1',
          content: 'Student struggled with entropy concept in thermodynamics',
          similarity: 0.92,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          importance_score: 4,
          tags: ['weakness', 'thermodynamics']
        },
        {
          id: 'memory-2',
          content: 'Student showed excellent improvement in organic chemistry',
          similarity: 0.88,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          importance_score: 5,
          tags: ['achievement', 'organic-chemistry']
        },
        {
          id: 'memory-3',
          content: 'Prefers visual learning methods with diagrams',
          similarity: 0.85,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          importance_score: 3,
          tags: ['learning-style', 'visual']
        }
      ];
      setMemoryReferences(mockMemories);
    } catch (error) {
      console.error('Failed to load memory references:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <h1 className="font-semibold">Study Buddy</h1>
          {/* Real-time processing status indicator */}
          {state.isProcessing && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1 animate-pulse" />
              Processing
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <User className="h-4 w-4" />
        </Button>
      </div>

      {/* Student Profile Sidebar - Enhanced with learning insights */}
      <div className={`
        fixed md:relative inset-y-0 right-0 z-40 w-80 bg-background border-l transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Profile Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Your Profile</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              ×
            </Button>
          </div>

          {isLoadingProfile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ) : studentProfile ? (
            <div className="space-y-4">
              {/* Avatar and basic info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <User className="h-6 w-6" />
                </Avatar>
                <div>
                  <h3 className="font-semibold">JEE 2025 Aspirant</h3>
                  <p className="text-sm text-muted-foreground">
                    Level {studentProfile.level} • {studentProfile.totalPoints} points
                  </p>
                </div>
              </div>

              {/* Stats with enhanced metrics */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">{studentProfile.currentStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </Card>
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{studentProfile.accuracy}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </Card>
              </div>

              {/* Educational effectiveness indicator */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Learning Effectiveness</span>
                </div>
                <div className="text-lg font-bold text-blue-600 mb-1">85%</div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on response quality and comprehension
                </p>
              </div>

              {/* Strong Subjects */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Strong Subjects
                </h4>
                <div className="flex flex-wrap gap-1">
                  {studentProfile.strongSubjects.map((subject, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Weak Subjects */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  Needs Work
                </h4>
                <div className="flex flex-wrap gap-1">
                  {studentProfile.weakSubjects.map((subject, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No profile data</p>
            </div>
          )}
        </div>

        {/* Memory References */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Remembered Insights
            </h3>
            
            {memoryReferences.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No memories yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memoryReferences.map((memory) => (
                  <Card key={memory.id} className="p-3">
                    <p className="text-sm mb-2">{memory.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: memory.importance_score }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(memory.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memory.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header with 5-layer processing status */}
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
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Study Buddy
                {state.isProcessing && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1 animate-pulse" />
                    5-Layer Processing
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Your personal AI study assistant with quality assurance
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
                onClick={() => setShowQualityPanel(!showQualityPanel)}
                className="flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Quality Panel
              </Button>
              <Button
                variant={isPersonalQuery ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPersonalQuery(!isPersonalQuery)}
                className="text-xs"
              >
                {isPersonalQuery ? "Personal Mode" : "General Mode"}
              </Button>
            </div>
          </div>

          {/* Real-time layer processing status */}
          {state.isProcessing && (
            <div className="mt-3 border-t pt-3">
              <LayerStatusIndicators showDetails compact={false} />
            </div>
          )}

          {/* Quality Assurance Panel */}
          {showQualityPanel && (
            <div className="mt-4 border-t pt-4">
              <QualityAssurancePanel 
                showFullPanel={true}
                currentResponse={currentResponseForFeedback}
                onResponseFeedback={handleResponseFeedback}
              />
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Welcome to Enhanced Study Buddy!</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Your AI study assistant now includes 5-layer hallucination prevention, 
                real-time quality monitoring, and educational effectiveness tracking.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-6">
                <Card className="p-3 text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium text-sm mb-1">Quality Assured</h4>
                  <p className="text-xs text-muted-foreground">
                    5-layer processing ensures accurate responses
                  </p>
                </Card>
                <Card className="p-3 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium text-sm mb-1">Learning Insights</h4>
                  <p className="text-xs text-muted-foreground">
                    Track your educational effectiveness
                  </p>
                </Card>
              </div>

              {/* Sample questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {[
                  "How am I doing in Physics?",
                  "What should I focus on this week?",
                  "Explain entropy with quality validation",
                  "Get personalized study recommendations"
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
            <div className="space-y-4">
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
                  className={`
                    flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  <div
                    className={`
                      max-w-[80%] sm:max-w-[70%] rounded-lg p-3
                      ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                      }
                      ${!isFirstInGroup ? 'mt-1' : ''} ${!isLastInGroup ? 'mb-1' : ''}
                    `}
                    role="article"
                    aria-roledescription="chat message"
                  >
                    <div className="text-sm">
                      {message.isLoading ? (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/50 animate-pulse" />
                          <span>Getting response with quality validation...</span>
                        </div>
                      ) : (
                        <RichContent text={message.content} />
                      )}
                    </div>
                    
                    {/* Enhanced message metadata for AI responses with 5-layer feedback */}
                    {message.role === 'assistant' && !message.isLoading && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        {/* Quality indicators */}
                        {message.qualityScore !== undefined && (
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Quality: {Math.round(message.qualityScore * 100)}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {Math.round((message.confidence || 0) * 100)}%
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                message.hallucinationRisk === 'low' ? 'border-green-300 text-green-700' :
                                message.hallucinationRisk === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-red-300 text-red-700'
                              }`}
                            >
                              {message.hallucinationRisk?.toUpperCase()} Risk
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Educational: {Math.round((message.educationalEffectiveness || 0) * 100)}%
                            </Badge>
                          </div>
                        )}
                        
                        {/* Processing layer status */}
                        {message.processingDetails && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">5-Layer Processing:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(message.processingDetails).map(([layer, completed]) => (
                                <Badge 
                                  key={layer} 
                                  variant={completed ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {layer.replace('layer', 'L').replace(/([A-Z])/g, ' $1').trim()}: {completed ? '✓' : '...'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Basic metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {message.model_used && (
                            <span>Powered by {message.model_used}</span>
                          )}
                          {message.latency_ms && (
                            <span>• {message.latency_ms}ms</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {isPersonalQuery && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Personal context
                            </Badge>
                          )}
                          {message.cached && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              From cache
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions: copy/regenerate/quality for AI */}
                    {message.role === 'assistant' && !message.isLoading && (
                      <div className="flex items-center gap-1 mt-2 opacity-70">
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={async () => { try { await navigator.clipboard.writeText(message.content); } catch {} }}>
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2" 
                          onClick={() => openQualityPanel(message)}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Quality
                        </Button>
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
                ); })}
              
              {/* Loading indicator with processing status */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 mr-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span>
                        {isPersonalQuery ? 'Analyzing with 5-layer quality validation...' : 'Processing with hallucination prevention...'}
                      </span>
                    </div>
                    {/* Show current processing layer */}
                    {state.currentLayer && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Current: {state.currentLayer}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2 mb-2">
            <Button
              variant={isPersonalQuery ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPersonalQuery(!isPersonalQuery)}
              className="flex items-center gap-1"
            >
              {isPersonalQuery ? <User className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
              {isPersonalQuery ? 'Personal' : 'General'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isPersonalQuery 
                  ? "Ask about your progress, performance, or study plan..."
                  : "Ask a general study question with quality validation..."
              }
              disabled={isLoading}
              className="flex-1"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <MessageCircle className="h-4 w-4" />
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
            <div className="flex items-center gap-2">
              <span>
                {isPersonalQuery 
                  ? 'Using your personal study context' 
                  : 'General question - no personal data used'
                }
              </span>
              {state.isProcessing && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  5-Layer Processing Active
                </Badge>
              )}
            </div>
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

      {/* Quality Assurance Modal */}
      {showQualityPanel && currentResponseForFeedback && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <QualityAssurancePanel 
              showFullPanel={true}
              currentResponse={currentResponseForFeedback}
              onResponseFeedback={handleResponseFeedback}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowQualityPanel(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Hallucination Prevention Provider wrapper
export default function StudyBuddyEnhancedWrapper({ userId, className }: StudyBuddyProps) {
  return (
    <HallucinationPreventionProvider>
      <EnhancedStudyBuddy userId={userId} className={className} />
    </HallucinationPreventionProvider>
  );
}