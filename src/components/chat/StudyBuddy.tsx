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
  AlertTriangle
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
import { AIFeaturesEngine } from '@/lib/ai/ai-features-engine';
import AlertBanner from '@/components/ui/alert-banner';
import RichContent from '@/components/chat/RichContent';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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

export default function StudyBuddy({ userId, className }: StudyBuddyProps) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [memoryReferences, setMemoryReferences] = useState<MemoryReference[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPersonalQuery, setIsPersonalQuery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiFeaturesActive, setAiFeaturesActive] = useState(false);
  const [aiFeaturesData, setAiFeaturesData] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{visible:boolean; message:string; lastPrompt?:string} | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<{isStoring:boolean; isRetrieving:boolean; lastMemoryFound?:number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load student profile and memories on mount
  useEffect(() => {
    loadStudentProfile();
    loadMemoryReferences();

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
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else setShowJump(true);
  }, [messages, autoScroll]);

  const loadStudentProfile = async () => {
    try {
      setIsLoadingProfile(true);
      // Mock data - in real implementation, this would fetch from actual API
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
      // Mock data - in real implementation, this would fetch from semantic search
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
      // Set memory status indicators
      setMemoryStatus({ isStoring: false, isRetrieving: true });
      
      // Use the new unified AI chat endpoint that handles memory automatically
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: messageText,
          conversationId: currentConversation?.id,
          chatType: 'study_assistant',
          includeMemoryContext: true,
          includePersonalizedSuggestions: true,
          memoryOptions: {
            query: isPersonalQuery ? messageText : undefined,
            limit: 5,
            minSimilarity: 0.1,
            searchType: 'hybrid',
            contextLevel: 'balanced'
          }
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to get response');
      }

      // Update memory status with results
      setMemoryStatus({
        isStoring: false,
        isRetrieving: false,
        lastMemoryFound: data.data.memoryContext?.memoriesFound || 0
      });

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.data.aiResponse.content,
        timestamp: new Date().toISOString(),
        model_used: data.data.aiResponse.model_used,
        provider_used: data.data.aiResponse.provider_used,
        tokens_used: data.data.aiResponse.tokens_used?.output || 0,
        latency_ms: data.data.aiResponse.latency_ms
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update conversation if needed
      if (data.data.aiResponse.conversationId && !currentConversation) {
        setCurrentConversation({ id: data.data.aiResponse.conversationId });
      }

      // Update memory references if memory context was found
      if (data.data.memoryContext && data.data.memoryContext.memoriesFound > 0) {
        const memoryRefs = data.data.memoryContext.searchResults.memories.map((memory: any) => ({
          id: memory.id,
          content: memory.content,
          similarity: memory.similarity,
          created_at: memory.created_at,
          importance_score: Math.round(memory.relevanceScore * 5), // Convert to 1-5 scale
          tags: memory.tags || []
        }));
        
        // Update memory references in the sidebar
        setMemoryReferences(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newRefs = memoryRefs.filter(m => !existingIds.has(m.id));
          return [...newRefs, ...prev].slice(0, 10); // Keep max 10
        });
      }

      setErrorBanner(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setErrorBanner({ visible: true, message: (error instanceof Error ? error.message : 'Failed to get response'), lastPrompt: messageText });
      
      // Reset memory status on error
      setMemoryStatus(null);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble accessing your study data right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Clear memory status after a short delay
      setTimeout(() => setMemoryStatus(null), 2000);
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
      console.log('🧠 Generating StudyBuddy AI insights for user:', userId);
      
      const response = await fetch('/api/features/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureIds: [1, 2, 3, 4, 5, 6], // Performance Analysis features
          userId,
          context: {
            studyData: {
              totalBlocks: 50,
              completedBlocks: 35,
              accuracy: studentProfile?.accuracy || 78
            },
            performanceHistory: [
              { date: '2025-11-01', score: 75 },
              { date: '2025-11-02', score: 82 },
              { date: '2025-11-03', score: studentProfile?.accuracy || 78 }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }

      const data = await response.json();
      setAiFeaturesData(data);
      setAiFeaturesActive(true);
      console.log('✅ StudyBuddy AI insights generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate StudyBuddy AI insights:', error);
      // Show user-friendly error message
      alert(`Study insights temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`);
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

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
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
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <User className="h-4 w-4" />
        </Button>
      </div>

      {/* Student Profile Sidebar */}
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

              {/* Stats */}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Study Buddy
              </h2>
              <p className="text-sm text-muted-foreground">
                Your personal AI study assistant with context
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Memory status indicator */}
              {memoryStatus && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/20 rounded-md text-xs">
                  {memoryStatus.isRetrieving && (
                    <>
                      <Brain className="h-3 w-3 animate-pulse" />
                      <span className="text-blue-600 dark:text-blue-400">Searching memory...</span>
                    </>
                  )}
                  {memoryStatus.isStoring && (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-green-600 dark:text-green-400">Storing memory...</span>
                    </>
                  )}
                  {!memoryStatus.isRetrieving && !memoryStatus.isStoring && memoryStatus.lastMemoryFound !== undefined && (
                    <>
                      <Star className="h-3 w-3 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400">
                        {memoryStatus.lastMemoryFound > 0 ? `Found ${memoryStatus.lastMemoryFound} memories` : 'No memory found'}
                      </span>
                    </>
                  )}
                </div>
              )}
              
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
          
          {/* AI Insights Panel for StudyBuddy */}
          {aiFeaturesActive && aiFeaturesData && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Personalized Study Analysis
              </h3>
              
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="weaknesses">Weak Areas</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="performance" className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Overall Accuracy</span>
                      </div>
                      <div className="text-2xl font-bold text-green-500 mb-1">{studentProfile?.accuracy || 78}%</div>
                      <Progress value={studentProfile?.accuracy || 78} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Based on your study data</p>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Current Streak</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-500 mb-1">{studentProfile?.currentStreak || 7} Days</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(studentProfile?.currentStreak || 7, 7) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-orange-500" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Keep the momentum!</p>
                    </Card>
                  </div>
                  
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Subject Performance</span>
                    </div>
                    <div className="space-y-2">
                      {studentProfile?.strongSubjects?.map((subject, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{subject}</span>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm text-green-500">Strong</span>
                          </div>
                        </div>
                      ))}
                      {studentProfile?.weakSubjects?.map((subject, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{subject}</span>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-sm text-orange-500">Needs Work</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="weaknesses" className="space-y-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Areas for Improvement</span>
                    </div>
                    <div className="space-y-3">
                      {studentProfile?.weakSubjects?.map((subject, i) => (
                        <div key={i} className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{subject}</span>
                            <Badge variant="outline" className="text-xs">Priority</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Focus on fundamental concepts and practice problems
                          </p>
                        </div>
                      ))}
                      
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">Study Pattern Analysis</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your performance dips during evening sessions. Consider scheduling difficult topics for afternoon.
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Personalized Recommendations</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">🎯 Today's Focus</p>
                        <p className="text-xs text-muted-foreground">
                          Spend 30 minutes on {studentProfile?.weakSubjects?.[0] || 'Thermodynamics'} using visual aids
                        </p>
                      </div>
                      
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">📚 Study Strategy</p>
                        <p className="text-xs text-muted-foreground">
                          Your visual learning style works well - use more diagrams for {studentProfile?.weakSubjects?.[1] || 'Physics'}
                        </p>
                      </div>
                      
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">⏰ Optimal Schedule</p>
                        <p className="text-xs text-muted-foreground">
                          Schedule practice tests for 2-4 PM when your concentration is peak
                        </p>
                      </div>
                      
                      <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">🔄 Review Cycle</p>
                        <p className="text-xs text-muted-foreground">
                          Review {studentProfile?.strongSubjects?.[0] || 'Organic Chemistry'} every 3 days to maintain mastery
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
              <Brain className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Welcome to Study Buddy!</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                I know your study profile and can provide personalized assistance. 
                Ask me about your progress, weak areas, or get tailored study advice!
              </p>
              
              {/* Mode toggle explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-6">
                <Card className="p-3 text-center">
                  <User className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium text-sm mb-1">Personal Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    Get insights about your specific progress and performance
                  </p>
                </Card>
                <Card className="p-3 text-center">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium text-sm mb-1">General Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    Ask general study questions without personal context
                  </p>
                </Card>
              </div>

              {/* Sample questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {[
                  "How am I doing in Physics?",
                  "What should I focus on this week?",
                  "Explain entropy in thermodynamics",
                  "Create a study plan for JEE 2025"
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
              {messages.map((message, idx) => { const prev = messages[idx - 1]; const next = messages[idx + 1]; const isFirstInGroup = !prev || prev.role !== message.role; const isLastInGroup = !next || next.role !== message.role; return (
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
                          <RichContent text={message.content} />
                      </div>
                    
                    {/* Message metadata for AI responses */}
                    {message.role === 'assistant' && (
                      <div className="mt-2 pt-2 border-t border-border/20">
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
                    
                    {/* Actions: copy/regenerate for AI */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 opacity-70">
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={async () => { try { await navigator.clipboard.writeText(message.content); } catch {} }}>
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => {
                          const prevUser = [...messages].slice(0, idx).reverse().find(m => m.role === 'user');
                          if (prevUser) {
                            setInputMessage(prevUser.content);
                            setTimeout(() => { sendMessage(); }, 0);
                          }
                        }}>
                          Regenerate
                        </Button>
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
              ); })}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 mr-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span>
                        {isPersonalQuery ? 'Analyzing your study data...' : 'Thinking...'}
                      </span>
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
                  : "Ask a general study question..."
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
          {showJump && !autoScroll && (
            <div className="flex justify-center mt-2">
              <Button size="sm" variant="secondary" onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); setShowJump(false); }}>
                Jump to latest
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {isPersonalQuery 
                ? 'Using your personal study context' 
                : 'General question - no personal data used'
              }
            </span>
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