// Study Buddy Chat Component with Layer 4 Integration
// ==================================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Lightbulb, HelpCircle, CheckCircle, Loader2, Star, ThumbsUp, ThumbsDown, MessageSquare, Settings, Brain, TrendingUp, Activity, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import MemoryReferences from './memory-references';
import type { StudyBuddyChatProps, UserFeedback, LearningPattern, PersonalizationProfile } from '@/types/study-buddy';

export function StudyBuddyChat({
  messages,
  onSendMessage,
  isLoading,
  preferences,
  onUpdatePreferences,
  studyContext,
}: StudyBuddyChatProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showLearningInsights, setShowLearningInsights] = useState(false);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [personalizationProfile, setPersonalizationProfile] = useState<PersonalizationProfile | null>(null);
  const [feedbackCollectionEnabled, setFeedbackCollectionEnabled] = useState(true);
  const [quickFeedback, setQuickFeedback] = useState<'positive' | 'negative' | null>(null);
  const [sessionStartTime] = useState(new Date());
  const [interactionCount, setInteractionCount] = useState(0);
  const [sessionMetrics, setSessionMetrics] = useState({
    startTime: new Date(),
    messageCount: 0,
    corrections: 0,
    timeSpent: 0,
    averageResponseTime: 0,
    satisfactionScore: 0,
    engagementLevel: 0
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Layer 4: Initialize learning session tracking
  useEffect(() => {
    const initializeLayer4 = () => {
      setFeedbackCollectionEnabled(true);
      
      // Initialize personalization profile
      setPersonalizationProfile({
        userId: 'user123', // TODO: Get from auth
        learningStyle: {
          type: 'reading_writing',
          strength: 0.7,
          preferences: {
            contentFormats: ['text', 'explanation'],
            interactionTypes: ['chat', 'questions'],
            difficultyProgression: 'gradual',
            feedbackFrequency: 'session_end'
          },
          adaptationHistory: {
            adaptations: 0,
            successfulChanges: 0,
            lastAdaptation: new Date()
          }
        },
        performanceMetrics: {
          overallAccuracy: 0.8,
          subjectPerformance: {},
          sessionPatterns: {
            averageSessionLength: 20,
            peakLearningHours: ['14:00', '15:00', '16:00'],
            preferredSessionLength: 25,
            breakFrequency: 0.3
          }
        },
        adaptationHistory: {
          lastAdaptation: new Date(),
          adaptationCount: 0,
          successfulAdaptations: 0,
          adaptationTypes: []
        },
        preferences: {
          responseStyle: 'detailed',
          explanationDepth: 'intermediate',
          examplePreference: 'concrete',
          interactionPreference: 'collaborative'
        },
        effectivePatterns: {
          successfulStrategies: [],
          learningTriggers: [],
          motivationFactors: [],
          studyMethods: []
        }
      });

      // Schedule feedback collection after 3 interactions
      if (interactionCount === 3) {
        feedbackTimeoutRef.current = setTimeout(() => {
          setShowFeedbackDialog(true);
        }, 30000);
      }
    };

    initializeLayer4();
  }, []);

  // Track interaction count
  useEffect(() => {
    if (messages.length > sessionMetrics.messageCount) {
      setSessionMetrics(prev => ({
        ...prev,
        messageCount: messages.length
      }));
      setInteractionCount(prev => prev + 1);
    }
  }, [messages]);

  // Handle scroll events and collect implicit feedback
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const scrollPercentage = (clientHeight - scrollTop) / clientHeight;
      
      setIsAtBottom(distanceFromBottom < 100);
      setShowScrollButton(!isAtBottom && distanceFromBottom > 200);
      
      // Collect implicit feedback based on scroll behavior
      if (feedbackCollectionEnabled) {
        setSessionMetrics(prev => ({
          ...prev,
          engagementLevel: Math.max(prev.engagementLevel, scrollPercentage)
        }));
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Layer 4: collectStudyFeedback() - Main feedback collection method
  const collectStudyFeedback = async (feedbackData: Partial<UserFeedback>) => {
    try {
      const currentTime = new Date();
      const sessionDuration = currentTime.getTime() - sessionMetrics.startTime.getTime();
      
      const feedback: UserFeedback = {
        id: `feedback_${Date.now()}`,
        userId: 'user123', // TODO: Get from auth
        sessionId: 'session123', // TODO: Generate
        interactionId: `interaction_${Date.now()}`,
        type: feedbackData.type || 'explicit',
        rating: feedbackData.rating,
        content: feedbackData.content,
        corrections: feedbackData.corrections,
        behaviorMetrics: {
          timeSpent: sessionDuration,
          scrollDepth: sessionMetrics.engagementLevel,
          followUpQuestions: sessionMetrics.messageCount,
          corrections: sessionMetrics.corrections,
          abandonment: false
        },
        context: {
          messageId: messages.length > 0 ? messages[messages.length - 1].id : 'unknown',
          response: messages.length > 0 ? messages[messages.length - 1].content : '',
          timestamp: currentTime,
          sessionDuration: sessionDuration
        },
        processed: false,
        createdAt: currentTime
      };

      setUserFeedback(prev => [...prev, feedback]);
      
      // Update session satisfaction
      if (feedbackData.rating) {
        setSessionMetrics(prev => ({
          ...prev,
          satisfactionScore: (prev.satisfactionScore + feedbackData.rating!) / 2
        }));
      }

      // Trigger learning pattern recognition for low feedback
      if (feedbackData.rating && feedbackData.rating < 3) {
        await recognizeStudyPatterns();
      }

      return feedback;
    } catch (error) {
      console.error('Failed to collect study feedback:', error);
    }
  };

  // Layer 4: adaptToLearningStyle() - Personalize responses
  const adaptToLearningStyle = async () => {
    try {
      if (!personalizationProfile) return null;

      // Analyze session patterns to adapt
      const adaptations: any[] = [];
      
      // Check response style preference
      if (sessionMetrics.satisfactionScore < 3.5) {
        adaptations.push({
          type: 'response_style',
          change: 'simplify',
          rationale: 'User satisfaction suggests need for clearer explanations'
        });
      }

      // Check engagement patterns
      if (sessionMetrics.engagementLevel < 0.6) {
        adaptations.push({
          type: 'engagement_boost',
          change: 'add_interactive_elements',
          rationale: 'Low scroll depth suggests need for more engaging content'
        });
      }

      // Update learning style strength
      const updatedProfile = {
        ...personalizationProfile,
        learningStyle: {
          ...personalizationProfile.learningStyle,
          strength: Math.min(1, personalizationProfile.learningStyle.strength + 0.1),
          adaptationHistory: {
            ...personalizationProfile.learningStyle.adaptationHistory,
            adaptations: personalizationProfile.learningStyle.adaptationHistory.adaptations + 1,
            successfulChanges: adaptations.length > 0 ? 
              personalizationProfile.learningStyle.adaptationHistory.successfulChanges + 1 :
              personalizationProfile.learningStyle.adaptationHistory.successfulChanges,
            lastAdaptation: new Date()
          }
        },
        adaptationHistory: {
          ...personalizationProfile.adaptationHistory,
          lastAdaptation: new Date(),
          adaptationCount: personalizationProfile.adaptationHistory.adaptationCount + 1,
          adaptationTypes: [
            ...personalizationProfile.adaptationHistory.adaptationTypes,
            ...adaptations.map(a => ({
              type: a.type,
              date: new Date(),
              success: 0.7, // Estimated success rate
              impact: a.rationale
            }))
          ]
        }
      };

      setPersonalizationProfile(updatedProfile);

      // Apply adaptations to preferences
      if (adaptations.length > 0) {
        const adaptationType = adaptations[0].type;
        if (adaptationType === 'response_style') {
          onUpdatePreferences({
            ...preferences,
            temperature: Math.max(0, preferences.temperature - 0.1) // More focused responses
          });
        }
      }

      return updatedProfile;
    } catch (error) {
      console.error('Failed to adapt to learning style:', error);
      return null;
    }
  };

  // Layer 4: trackLearningProgress() - Monitor educational improvement
  const trackLearningProgress = async () => {
    try {
      const currentTime = new Date();
      const sessionDuration = currentTime.getTime() - sessionMetrics.startTime.getTime();
      const averageResponseTime = sessionDuration / Math.max(sessionMetrics.messageCount, 1);
      
      // Calculate effectiveness metrics
      const effectiveness = {
        sessionEffectiveness: Math.min(1, (sessionMetrics.satisfactionScore / 5) * 0.4 + 
          (sessionMetrics.engagementLevel) * 0.3 + 
          (sessionMetrics.messageCount > 5 ? 0.3 : 0.1)),
        learningVelocity: sessionMetrics.messageCount / (sessionDuration / 60000), // messages per minute
        retentionRate: Math.min(1, sessionMetrics.satisfactionScore / 5),
        engagementScore: sessionMetrics.engagementLevel,
        satisfactionTrend: sessionMetrics.satisfactionScore > 3 ? 'improving' as const : 'stable' as const,
        adaptationSuccess: personalizationProfile ? 
          personalizationProfile.learningStyle.adaptationHistory.successfulChanges / 
          Math.max(personalizationProfile.learningStyle.adaptationHistory.adaptations, 1) : 0,
        recommendedActions: [
          sessionMetrics.engagementLevel < 0.6 ? 'Increase interactive content' : '',
          sessionMetrics.satisfactionScore < 3 ? 'Simplify explanations' : '',
          sessionMetrics.messageCount < 3 ? 'Encourage more questions' : '',
        ].filter(Boolean),
        nextSessionPreparation: [
          'Continue current difficulty level',
          'Maintain current pacing',
          'Focus on weak subjects'
        ]
      };

      // Update session metrics
      setSessionMetrics(prev => ({
        ...prev,
        averageResponseTime,
        timeSpent: sessionDuration
      }));

      // Show learning insights dialog
      setShowLearningInsights(true);

      return effectiveness;
    } catch (error) {
      console.error('Failed to track learning progress:', error);
    }
  };

  // Layer 4: recognizeStudyPatterns() - Identify learning strategies
  const recognizeStudyPatterns = async () => {
    try {
      const patterns: LearningPattern[] = [];

      // Analyze engagement patterns
      if (sessionMetrics.engagementLevel > 0.8) {
        patterns.push({
          id: 'engagement_high',
          userId: 'user123',
          patternType: 'engagement',
          pattern: {
            name: 'High Engagement Pattern',
            description: 'User consistently engages with content through scrolling and interaction',
            triggers: ['detailed_explanations', 'interactive_content'],
            frequency: sessionMetrics.engagementLevel,
            strength: sessionMetrics.engagementLevel,
            lastDetected: new Date()
          },
          metrics: {
            confidence: 0.8,
            supportCount: sessionMetrics.messageCount,
            accuracy: sessionMetrics.satisfactionScore / 5,
            consistency: 0.7
          },
          insights: [
            'User prefers detailed content',
            'Interactive elements increase engagement',
            'Long-form explanations are appreciated'
          ],
          recommendations: [
            'Provide more detailed explanations',
            'Include interactive examples',
            'Use step-by-step breakdowns'
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Analyze learning style pattern
      if (sessionMetrics.satisfactionScore > 4) {
        patterns.push({
          id: 'collaborative_learning',
          userId: 'user123',
          patternType: 'learning',
          pattern: {
            name: 'Collaborative Learning Style',
            description: 'User responds well to collaborative, question-based interactions',
            triggers: ['questions', 'discussions', 'guided_inquiry'],
            frequency: 0.6,
            strength: sessionMetrics.satisfactionScore / 5,
            lastDetected: new Date()
          },
          metrics: {
            confidence: 0.75,
            supportCount: sessionMetrics.messageCount,
            accuracy: sessionMetrics.satisfactionScore / 5,
            consistency: 0.8
          },
          insights: [
            'User prefers guided learning approach',
            'Questions help reinforce understanding',
            'Collaborative tone improves satisfaction'
          ],
          recommendations: [
            'Use more Socratic questioning',
            'Encourage user participation',
            'Provide collaborative exercises'
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setLearningPatterns(patterns);
      return patterns;
    } catch (error) {
      console.error('Failed to recognize study patterns:', error);
      return [];
    }
  };

  // Quick feedback handlers
  const handleQuickFeedback = (type: 'positive' | 'negative') => {
    setQuickFeedback(type);
    collectStudyFeedback({
      type: 'satisfaction',
      rating: type === 'positive' ? 5 : 2,
      content: type === 'positive' ? 'Quick positive feedback' : 'Quick negative feedback'
    });
  };

  // Session summary and cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      // Final session summary
      if (sessionMetrics.messageCount > 0) {
        trackLearningProgress();
      }
    };
  }, []);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    await onSendMessage(content, attachments);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', Array.from(files));
      event.target.value = '';
    }
  };

  // Study Buddy specific quick actions with Layer 4 integration
  const handleQuickAction = async (action: string, prompt: string) => {
    if (studyContext.subject) {
      await handleSendMessage(`${prompt}\n\nStudy Context: ${studyContext.subject} (${studyContext.difficultyLevel} level)`);
    } else {
      await handleSendMessage(prompt);
    }
    
    // Trigger adaptation after quick actions
    setTimeout(() => {
      adaptToLearningStyle();
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Layer 4: Quick Feedback Controls */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Learning Insights Active</span>
            {feedbackCollectionEnabled && (
              <Badge variant="outline" className="text-xs">Auto-feedback</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick feedback buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={quickFeedback === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFeedback('positive')}
                className="h-11 w-11 p-0"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant={quickFeedback === 'negative' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleQuickFeedback('negative')}
                className="h-11 w-11 p-0"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Learning insights button */}
            <Button
              variant="outline"
              size="sm"
              onClick={trackLearningProgress}
              className="h-11"
            >
              <Activity className="h-3 w-3 mr-1" />
              Progress
            </Button>
            
            {/* Pattern recognition button */}
            <Button
              variant="outline"
              size="sm"
              onClick={recognizeStudyPatterns}
              className="h-11"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Patterns
            </Button>
          </div>
        </div>
        
        {/* Session metrics display */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{sessionMetrics.messageCount} interactions</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>Satisfaction: {sessionMetrics.satisfactionScore.toFixed(1)}/5</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Engagement: {Math.round(sessionMetrics.engagementLevel * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Study Buddy Quick Actions */}
      {messages.length === 0 && studyContext.subject && (
        <div className="border-b bg-blue-50/50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('explain', `Can you explain the key concepts in ${studyContext.subject} that I should understand?`)}
              className="text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Explain Key Concepts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('quiz', `Create 5 practice questions about ${studyContext.subject} to help me test my understanding.`)}
              className="text-xs"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Practice Questions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('summary', `Summarize the most important topics in ${studyContext.subject} that I need to remember.`)}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Quick Summary
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('tips', `Give me study tips and strategies specifically for learning ${studyContext.subject}.`)}
              className="text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              Study Tips
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-4" 
        onScrollCapture={handleScroll}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <Card className="p-8 text-center border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Hi there! I'm your AI Coach 👋
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    I'm here to provide personalized study help using your learning data and progress. Ask me about your studies, and I'll give you insights tailored to you!
                  </p>
                  
                  {/* Layer 4 Features Highlight */}
                  <div className="bg-white/70 rounded-lg p-4 text-left max-w-md mx-auto border border-blue-200">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      Enhanced Learning Features:
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span>Real-time progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <span>Pattern recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-purple-500" />
                        <span>Adaptive learning style</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Study Context Display */}
                  {studyContext.subject ? (
                    <div className="bg-white/70 rounded-lg p-4 text-left max-w-md mx-auto border border-blue-200 mt-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Current Study Session:
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Subject: <span className="font-semibold text-blue-800">{studyContext.subject}</span></div>
                        <div>Level: <span className="font-semibold">{studyContext.difficultyLevel}</span></div>
                        {studyContext.learningGoals.length > 0 && (
                          <div>Goals: <span className="font-semibold">{studyContext.learningGoals.slice(0, 2).join(', ')}</span></div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">
                          💡 Tip: Ask me personal questions like "How am I doing?" or "What should I focus on?" for personalized insights!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto mt-4">
                      <p className="text-sm text-amber-800">
                        🎯 <strong>Pro tip:</strong> Set your study context (brain icon) to get more personalized help!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Messages */}
          <div className="space-y-4" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, idx) => {
              const prev = messages[idx - 1];
              const next = messages[idx + 1];
              const isFirstInGroup = !prev || prev.role !== message.role;
              const isLastInGroup = !next || next.role !== message.role;
              const showHeader = isFirstInGroup;
              return (
                <motion.div key={message.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <MessageBubble
                    message={message}
                    isStreaming={message.streaming || false}
                    showHeader={showHeader}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onRegenerate={() => {
                      const prevUser = [...messages].slice(0, idx).reverse().find(m => m.role === 'user');
                      if (prevUser) {
                        onSendMessage(prevUser.content);
                      }
                    }}
                  />
                  {message.role === 'assistant' && message.memory_references && message.memory_references.length > 0 && (
                    <MemoryReferences memoryReferences={message.memory_references} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-blue-700 font-medium">
                      Getting personalized response...
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute bottom-20 right-6 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      )}

      {/* Chat Input */}
      <div className="border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            disabled={isLoading}
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx,.md,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Context Info */}
          {studyContext.subject && (
            <div className="mt-2 text-xs text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
                <Target className="h-3 w-3 text-blue-600" />
                <span className="text-blue-800 font-medium">Studying {studyContext.subject}</span>
                <span className="text-blue-600">•</span>
                <span className="text-blue-700">{studyContext.difficultyLevel} level</span>
                {studyContext.learningGoals.length > 0 && (
                  <>
                    <span className="text-blue-600">•</span>
                    <span className="text-blue-700">{studyContext.learningGoals.slice(0, 2).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Layer 4: Feedback Collection Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              How was this session?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Based on your {sessionMetrics.messageCount} interactions, I'd love to hear your feedback!
            </div>
            
            {/* Star rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    collectStudyFeedback({
                      type: 'satisfaction',
                      rating,
                      content: `Rated session ${rating}/5 stars`
                    });
                    setShowFeedbackDialog(false);
                  }}
                  className="p-2"
                >
                  <Star className="h-6 w-6 text-yellow-400" />
                </Button>
              ))}
            </div>
            
            {/* Text feedback */}
            <Textarea
              placeholder="Any additional feedback or suggestions?"
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  collectStudyFeedback({
                    type: 'explicit',
                    content: e.target.value
                  });
                }
              }}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(false)}
              >
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Layer 4: Learning Insights Dialog */}
      <Dialog open={showLearningInsights} onOpenChange={setShowLearningInsights}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Learning Insights
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Session metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3">
                <div className="text-sm font-medium text-gray-600">Interactions</div>
                <div className="text-2xl font-bold text-blue-600">{sessionMetrics.messageCount}</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium text-gray-600">Satisfaction</div>
                <div className="text-2xl font-bold text-green-600">
                  {sessionMetrics.satisfactionScore.toFixed(1)}/5
                </div>
              </Card>
            </div>
            
            {/* Learning patterns */}
            {learningPatterns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Detected Patterns:</h4>
                <div className="space-y-2">
                  {learningPatterns.map((pattern) => (
                    <Card key={pattern.id} className="p-3">
                      <div className="font-medium text-sm">{pattern.pattern.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{pattern.pattern.description}</div>
                      <div className="text-xs text-blue-600 mt-2">
                        Strength: {Math.round(pattern.pattern.strength * 100)}%
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Recommendations:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Continue with current learning pace</li>
                <li>• Try more interactive examples</li>
                <li>• Ask follow-up questions for deeper understanding</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowLearningInsights(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudyBuddyChat;