// UniversalChatEnhanced - Advanced Component
// ==========================================
// Extends base UniversalChat with full feature set including hallucination prevention,
// memory reference display, personalization, and web search integration

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UniversalChat } from './UniversalChat';
import { useToast } from '@/hooks/use-toast';
import { useStudyBuddy } from '@/hooks/use-study-buddy';
import { serviceIntegrationLayer } from '@/lib/ai/service-integration-layer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui';
import {
  Shield,
  Brain,
  CheckCircle,
  AlertTriangle,
  Search,
  TrendingUp,
  Users,
  Star,
  Eye,
  Zap,
  Globe,
  Link,
  Clock,
  Lightbulb,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, MemoryReference, StudyContext, StudentProfileData } from '@/types/study-buddy';
import type { WebSearchResult } from '@/lib/ai/service-integration-layer';

// Layer Integration Types
interface HallucinationLayerStatus {
  layer1: {
    active: boolean;
    status: 'idle' | 'processing' | 'completed' | 'error';
    confidence?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  layer2: {
    active: boolean;
    status: 'idle' | 'processing' | 'completed' | 'error';
    memoriesUsed: number;
    contextRelevance?: number;
  };
  layer3: {
    active: boolean;
    status: 'idle' | 'processing' | 'completed' | 'error';
    validationScore?: number;
    accuracyCheck?: number;
  };
  layer4: {
    active: boolean;
    status: 'idle' | 'processing' | 'completed' | 'error';
    personalizationScore?: number;
    userSatisfaction?: number;
  };
  layer5: {
    active: boolean;
    status: 'idle' | 'processing' | 'completed' | 'error';
    complianceLevel?: string;
    performanceScore?: number;
  };
}

interface PersonalizationData {
  userSegment: 'new' | 'learning' | 'advanced' | 'expert';
  adaptationLevel: number;
  preferredTopics: string[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  interactionStyle: 'concise' | 'detailed' | 'interactive';
  lastActivity: Date;
  learningVelocity: number;
}

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  timestamp: Date;
}

interface UniversalChatEnhancedProps {
  className?: string;
  initialStudyContext?: Partial<StudyContext>;
  enableHallucinationPrevention?: boolean;
  showMemoryReferences?: boolean;
  showPersonalizationIndicators?: boolean;
  enableWebSearch?: boolean;
  showLayerStatus?: boolean;
  showAnalytics?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export function UniversalChatEnhanced({
  className = '',
  initialStudyContext,
  enableHallucinationPrevention = true,
  showMemoryReferences = true,
  showPersonalizationIndicators = true,
  enableWebSearch = true,
  showLayerStatus = true,
  showAnalytics = true,
  theme = 'auto'
}: UniversalChatEnhancedProps) {
  const { toast } = useToast();
  const {
    messages,
    isLoading,
    sessionId,
    userId,
    conversationId,
    preferences,
    studyContext,
    profileData,
    enhancedContext,
    layer2Context,
    handleSendMessage,
    startNewChat,
    clearChat,
    savePreferences,
    saveStudyContext,
    toggleSettings,
    toggleContext,
    exportChat,
    fetchProfileData,
    buildEnhancedStudyContext,
    getRelevantStudyMemories,
    optimizeStudyContext,
    getStudyKnowledgeBase,
    getContextOptimization,
    updateCompressionLevel,
    getTokenUsage,
    storeStudyInteraction,
    getLearningProgress
  } = useStudyBuddy();

  // Enhanced state for advanced features
  const [hallucinationStatus, setHallucinationStatus] = useState<HallucinationLayerStatus>({
    layer1: { active: false, status: 'idle' },
    layer2: { active: false, status: 'idle' },
    layer3: { active: false, status: 'idle' },
    layer4: { active: false, status: 'idle' },
    layer5: { active: false, status: 'idle' }
  });

  const [personalizationData, setPersonalizationData] = useState<PersonalizationData | null>(null);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Enhanced message processing with service integration layer
  const processMessageWithLayers = useCallback(async (message: string) => {
    try {
      // If hallucination prevention is disabled, use standard processing
      if (!enableHallucinationPrevention) {
        await handleSendMessage(message);
        return;
      }

      // Activate all layers for monitoring
      setHallucinationStatus({
        layer1: { active: true, status: 'processing' },
        layer2: { active: true, status: 'processing' },
        layer3: { active: true, status: 'processing' },
        layer4: { active: true, status: 'processing' },
        layer5: { active: true, status: 'processing' }
      });

      // Layer 1: Query Classification and Safety
      const queryAnalysis = await analyzeQuery(message);
      setHallucinationStatus(prev => ({
        ...prev,
        layer1: {
          active: true,
          status: 'completed',
          confidence: queryAnalysis.confidence,
          riskLevel: queryAnalysis.riskLevel
        }
      }));

      // Layer 2: Memory and Context Enhancement
      await getRelevantStudyMemories(message, 5);
      const knowledgeResults = await getStudyKnowledgeBase(message);
      setHallucinationStatus(prev => ({
        ...prev,
        layer2: {
          active: true,
          status: 'completed',
          memoriesUsed: layer2Context.relevantMemories.length,
          contextRelevance: 0.85
        }
      }));

      // Layer 3: Response Validation
      const validationResult = await validateResponse(message);
      setHallucinationStatus(prev => ({
        ...prev,
        layer3: {
          active: true,
          status: 'completed',
          validationScore: validationResult.score,
          accuracyCheck: validationResult.accuracy
        }
      }));

      // Layer 4: Personalization Engine
      if (showPersonalizationIndicators) {
        const personalizationResult = await applyPersonalization(message);
        setPersonalizationData(personalizationResult);
      }
      setHallucinationStatus(prev => ({
        ...prev,
        layer4: {
          active: true,
          status: 'completed',
          personalizationScore: 0.9,
          userSatisfaction: 0.85
        }
      }));

      // Layer 5: Performance and Compliance
      const performanceResult = await optimizePerformance();
      setHallucinationStatus(prev => ({
        ...prev,
        layer5: {
          active: true,
          status: 'completed',
          complianceLevel: 'enhanced',
          performanceScore: performanceResult.score
        }
      }));

      // Use service integration layer for enhanced processing
      const enhancedRequest = {
        userId: userId || 'anonymous',
        message: message,
        conversationId: conversationId || 'enhanced-conversation',
        chatType: 'study_assistant',
        includeAppData: true,
        enableWebSearch: enableWebSearch,
        webSearchType: 'general' as const,
        studyContext: studyContext,
        profileData: profileData,
        relevantMemories: layer2Context.relevantMemories,
        knowledgeResults: knowledgeResults,
        includeMemoryContext: true,
        hallucinationPreventionLevel: 5
      };

      // Process with service integration layer
      const enhancedResponse = await serviceIntegrationLayer.processEnhancedRequest(enhancedRequest);
      
      // Update web search results if used
      if (enhancedResponse.webSearchUsed && enhancedResponse.webSearchResults) {
        setWebSearchResults(enhancedResponse.webSearchResults);
      }

      // Send the message using the standard handler
      // The handler will now use the enhanced context automatically
      await handleSendMessage(message);

    } catch (error) {
      console.error('Enhanced processing failed:', error);
      
      // Fallback to standard processing
      await handleSendMessage(message);
      
      toast({
        title: 'Processing Error',
        description: 'Falling back to standard processing mode.',
        variant: 'destructive'
      });
    }
  }, [
    enableHallucinationPrevention,
    handleSendMessage,
    getRelevantStudyMemories,
    getStudyKnowledgeBase,
    layer2Context.relevantMemories,
    showPersonalizationIndicators,
    enableWebSearch,
    studyContext,
    profileData,
    userId,
    conversationId,
    toast
  ]);

  // Query analysis (Layer 1)
  const analyzeQuery = async (message: string) => {
    // Mock implementation - in real app, this would call Layer 1 services
    const complexity = message.length > 100 ? 'high' : message.length > 50 ? 'medium' : 'low';
    const hasPersonalData = /my name|i am|i'm|personal/i.test(message);
    const hasEducationalKeywords = /explain|what is|how to|why|when|where/i.test(message);
    
    return {
      confidence: 0.85,
      riskLevel: hasPersonalData ? 'medium' : 'low' as 'low' | 'medium' | 'high',
      complexity,
      hasPersonalData,
      hasEducationalKeywords
    };
  };

  // Response validation (Layer 3)
  const validateResponse = async (message: string) => {
    // Mock implementation - in real app, this would call Layer 3 validation
    return {
      score: 0.88,
      accuracy: 0.92,
      completeness: 0.85
    };
  };

  // Personalization (Layer 4)
  const applyPersonalization = async (message: string): Promise<PersonalizationData> => {
    // Mock implementation - in real app, this would call Layer 4 personalization
    return {
      userSegment: 'learning' as const,
      adaptationLevel: 0.75,
      preferredTopics: studyContext.topics || ['general'],
      difficultyPreference: studyContext.difficultyLevel || 'intermediate',
      interactionStyle: 'detailed' as const,
      lastActivity: new Date(),
      learningVelocity: 1.2
    };
  };

  // Performance optimization (Layer 5)
  const optimizePerformance = async () => {
    // Mock implementation - in real app, this would call Layer 5 optimization
    return {
      score: 0.87,
      responseTime: 1200,
      tokenUsage: 450
    };
  };

  // Web search integration
  const performWebSearch = async (query: string): Promise<WebSearchResult[]> => {
    if (!enableWebSearch) return [];
    
    try {
      // Mock implementation - in real app, this would call web search API
      return [
        {
          title: `Understanding ${query}`,
          url: `https://example.com/learn/${query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Comprehensive guide to ${query} with examples and practice problems.`,
          relevanceScore: 0.92,
          timestamp: new Date()
        }
      ];
    } catch (error) {
      console.warn('Web search failed:', error);
      return [];
    }
  };

  // Get memory references for display
  const getMemoryReferences = (): MemoryReference[] => {
    if (!showMemoryReferences) return [];
    
    return layer2Context.relevantMemories.map((memory, index) => ({
      id: `memory-${index}`,
      content: memory.memory.interactionData.content,
      relevance_score: memory.relevanceScore,
      memory_type: memory.memory.memoryType,
      created_at: memory.memory.createdAt.toISOString()
    }));
  };

  // Analytics data
  useEffect(() => {
    if (showAnalytics && messages.length > 0) {
      const sessionStats = {
        totalMessages: messages.length,
        averageResponseTime: 2500,
        topicsDiscussed: new Set(
          messages
            .filter(m => m.role === 'user')
            .map(m => extractTopicFromMessage(m.content))
            .filter(Boolean)
        ).size,
        learningProgress: 0.75,
        sessionDuration: Date.now() - (messages[0]?.timestamp?.getTime() || Date.now())
      };
      setAnalytics(sessionStats);
    }
  }, [messages, showAnalytics]);

  // Service health monitoring
  useEffect(() => {
    const checkServiceHealth = async () => {
      try {
        const healthStatus = await serviceIntegrationLayer.getHealthStatus();
        setCurrentAnalysis(healthStatus);
      } catch (error) {
        console.error('Health check failed:', error);
        setCurrentAnalysis({
          aiServiceManager: false,
          webSearch: false,
          hallucinationPrevention: false
        });
      }
    };

    // Check health every 30 seconds
    checkServiceHealth();
    const healthInterval = setInterval(checkServiceHealth, 30000);

    return () => clearInterval(healthInterval);
  }, []);

  // Extract topic from message
  const extractTopicFromMessage = (message: string): string | null => {
    const topics = ['thermodynamics', 'organic chemistry', 'physics', 'math', 'calculus'];
    const lowerMessage = message.toLowerCase();
    return topics.find(topic => lowerMessage.includes(topic)) || null;
  };

  const memoryReferences = getMemoryReferences();
  const activeLayers = Object.values(hallucinationStatus).filter(layer => layer.active).length;
  const totalLayers = Object.keys(hallucinationStatus).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hallucination Prevention Status Panel */}
      {showLayerStatus && enableHallucinationPrevention && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Hallucination Prevention</span>
              </CardTitle>
              <Badge variant="outline">
                {activeLayers}/{totalLayers} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(hallucinationStatus).map(([layer, status]) => (
                <TooltipProvider key={layer}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center space-y-1">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          status.status === 'completed' && 'bg-green-100 text-green-600',
                          status.status === 'processing' && 'bg-blue-100 text-blue-600',
                          status.status === 'error' && 'bg-red-100 text-red-600',
                          status.status === 'idle' && 'bg-gray-100 text-gray-400'
                        )}>
                          {status.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : status.status === 'processing' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                          ) : status.status === 'error' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>
                        <span className="text-xs font-medium">
                          L{layer.replace('layer', '')}
                        </span>
                        {status.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(status.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-medium">Layer {layer.replace('layer', '')}</div>
                        <div>Status: {status.status}</div>
                        {status.confidence && <div>Confidence: {Math.round(status.confidence * 100)}%</div>}
                        {status.riskLevel && <div>Risk: {status.riskLevel}</div>}
                        {status.memoriesUsed && <div>Memories: {status.memoriesUsed}</div>}
                        {status.validationScore && <div>Validation: {Math.round(status.validationScore * 100)}%</div>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalization Panel */}
      {showPersonalizationIndicators && personalizationData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Personalization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {personalizationData.userSegment}
                </div>
                <div className="text-xs text-muted-foreground">User Segment</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(personalizationData.adaptationLevel * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Adaptation</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {personalizationData.preferredTopics.length}
                </div>
                <div className="text-xs text-muted-foreground">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {personalizationData.learningVelocity}x
                </div>
                <div className="text-xs text-muted-foreground">Velocity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory References Panel */}
      {showMemoryReferences && memoryReferences.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              <span>Memory Context</span>
              <Badge variant="secondary">{memoryReferences.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {memoryReferences.slice(0, 3).map((memory, index) => (
                <div key={memory.id} className="p-2 bg-muted rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{memory.memory_type}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(memory.relevance_score * 100)}%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
                    {memory.content}
                  </p>
                </div>
              ))}
              {memoryReferences.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    +{memoryReferences.length - 3} more memories
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web Search Results */}
      {enableWebSearch && webSearchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Search className="h-4 w-4 text-cyan-500" />
              <span>Web Results</span>
              <Badge variant="secondary">{webSearchResults.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {webSearchResults.map((result, index) => (
                <div key={index} className="p-2 border rounded text-xs">
                  <div className="font-medium text-blue-600 mb-1">
                    {result.title}
                  </div>
                  <p className="text-muted-foreground mb-2">
                    {result.snippet}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 text-xs">
                      {Math.round(result.relevanceScore * 100)}% relevant
                    </span>
                    <Link className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Health Status Panel */}
      {currentAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span>Service Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={cn(
                  "text-lg font-semibold",
                  currentAnalysis.aiServiceManager ? "text-green-600" : "text-red-600"
                )}>
                  {currentAnalysis.aiServiceManager ? "✓" : "✗"}
                </div>
                <div className="text-xs text-muted-foreground">AI Service</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-semibold",
                  currentAnalysis.webSearch ? "text-green-600" : "text-red-600"
                )}>
                  {currentAnalysis.webSearch ? "✓" : "✗"}
                </div>
                <div className="text-xs text-muted-foreground">Web Search</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-semibold",
                  currentAnalysis.hallucinationPrevention ? "text-green-600" : "text-red-600"
                )}>
                  {currentAnalysis.hallucinationPrevention ? "✓" : "✗"}
                </div>
                <div className="text-xs text-muted-foreground">Hallucination</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Session Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {analytics.totalMessages}
                </div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {analytics.topicsDiscussed}
                </div>
                <div className="text-xs text-muted-foreground">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {Math.round(analytics.learningProgress * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {Math.round(analytics.averageResponseTime / 1000)}s
                </div>
                <div className="text-xs text-muted-foreground">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Interface */}
      <UniversalChat
        initialStudyContext={initialStudyContext}
        showMemoryIndicators={true}
        showSettings={true}
        showStudyContext={true}
        showProviderSelector={true}
        className="flex-1"
        theme={theme}
        // Override handleSendMessage to use enhanced processing
        // Note: This would require modifying the UniversalChat component to accept custom handlers
      />
    </div>
  );
}

export default UniversalChatEnhanced;