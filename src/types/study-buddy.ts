// Study Buddy Type Definitions
// =============================

// Message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  streaming?: boolean;
  memory_references?: Array<{
    content: string;
    similarity: number;
    created_at: string;
  }>;
}

// Study context types
export interface StudyContext {
  subject: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  topics: string[];
  timeSpent: number;
  lastActivity: Date;
}

// Chat preferences types
export interface ChatPreferences {
  provider: string;
  model?: string;
  streamResponses: boolean;
  temperature: number;
  maxTokens: number;
  studyContext?: StudyContext;
}

// Student profile types
export interface StudentProfileData {
  profileText: string;
  strongSubjects: string[];
  weakSubjects: string[];
  examTarget?: string;
  studyProgress: {
    totalTopics: number;
    completedTopics: number;
    accuracy: number;
  };
  currentData: {
    streak: number;
    level: number;
    points: number;
    revisionQueue: number;
  };
  lastUpdated: string;
  memoryStats?: {
    totalMemories: number;
    memoriesSince: string;
  };
}

// Memory reference types
export interface MemoryReference {
  content: string;
  similarity: number;
  created_at: string;
  relevanceScore?: number;
}

// Study buddy API response types
export interface StudyBuddyApiResponse {
  success: boolean;
  data: {
    response: {
      content: string;
      model_used: string;
      provider_used: string;
      tokens_used: {
        input: number;
        output: number;
      };
      latency_ms: number;
      query_type: string;
      web_search_enabled: boolean;
      fallback_used: boolean;
      cached: boolean;
      isTimeSensitive: boolean;
      language: 'hinglish';
      context_included: boolean;
      memory_references?: MemoryReference[];
    };
    conversationId: string;
    timestamp: string;
    metadata: {
      isPersonalQuery: boolean;
      contextLevel: 1 | 2 | 3 | 4;
      memoriesSearched: number;
      insightsExtracted: number;
      cohereUsage: {
        embeddingsGenerated: number;
        monthlyUsage: number;
        monthlyLimit: number;
      };
    };
  };
  error?: string;
}

// Study buddy API request types
export interface StudyBuddyApiRequest {
  userId: string;
  conversationId: string;
  message: string;
  chatType: 'study_assistant';
  isPersonalQuery?: boolean;
}

// Context levels
export type ContextLevel = 1 | 2 | 3 | 4;

// Personal question detection types
export interface PersonalQuestionDetection {
  isPersonal: boolean;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

// Student context types for memory system
export interface StudentContext {
  userId: string;
  profileText: string;
  strongSubjects: string[];
  weakSubjects: string[];
  examTarget?: string;
  studyProgress: {
    totalTopics: number;
    completedTopics: number;
    accuracy: number;
  };
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  revisionQueue: Array<{
    topic: string;
    difficulty: number;
    lastAttempted: Date;
  }>;
  performanceHistory: Array<{
    subject: string;
    score: number;
    date: Date;
  }>;
}

// Memory system types
export interface MemoryInsight {
  id: string;
  userId: string;
  content: string;
  type: 'study_pattern' | 'performance' | 'weakness' | 'strength' | 'strategy';
  confidence: number;
  created_at: string;
  embedding?: number[];
  conversation_context?: string;
}

export interface SemanticSearchResult {
  memories: Array<{
    id: string;
    content: string;
    similarity: number;
    created_at: string;
    type: string;
  }>;
  searchTime: number;
  totalFound: number;
}

// Component props types
export interface StudyBuddyChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  isLoading: boolean;
  preferences: ChatPreferences;
  onUpdatePreferences: (preferences: Partial<ChatPreferences>) => void;
  studyContext: StudyContext;
  isAtBottom?: boolean;
  showScrollButton?: boolean;
}

export interface ProfileCardProps {
  userId: string;
  className?: string;
  showMemoryStats?: boolean;
}

export interface MemoryReferencesProps {
  memoryReferences: MemoryReference[];
  className?: string;
}

export interface StudyBuddyPageProps {
  // Future props for configuration
}

// Study buddy state management types
export interface StudyBuddyState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;
  userId: string;
  conversationId: string;
  preferences: ChatPreferences;
  studyContext: StudyContext;
  isSettingsOpen: boolean;
  isContextOpen: boolean;
  profileData: StudentProfileData | null;
}

export interface StudyBuddyActions {
initializeSession: () => Promise<void>;
handleSendMessage: (content: string, attachments?: File[]) => Promise<void>;
startNewChat: () => void;
clearChat: () => void;
savePreferences: (preferences: Partial<ChatPreferences>) => void;
saveStudyContext: (context: StudyContext) => void;
toggleSettings: () => void;
toggleContext: () => void;
exportChat: () => void;
fetchProfileData: () => Promise<void>;
}
// Layer 4: User Feedback & Learning Types
// ======================================

// User feedback types
export interface UserFeedback {
  id: string;
  userId: string;
  sessionId: string;
  interactionId: string;
  type: 'explicit' | 'implicit' | 'correction' | 'satisfaction' | 'behavioral';
  rating?: number; // 1-5 scale
  content?: string;
  corrections?: Array<{
    original: string;
    corrected: string;
    type: 'factual' | 'clarity' | 'tone' | 'completeness';
    confidence: number;
  }>;
  behaviorMetrics?: {
    timeSpent: number;
    scrollDepth: number;
    followUpQuestions: number;
    corrections: number;
    abandonment: boolean;
  };
  context: {
    messageId: string;
    response: string;
    timestamp: Date;
    sessionDuration: number;
  };
  processed: boolean;
  createdAt: Date;
}

// Learning pattern types
export interface LearningPattern {
  id: string;
  userId: string;
  patternType: 'behavioral' | 'learning' | 'engagement' | 'performance' | 'preference';
  pattern: {
    name: string;
    description: string;
    triggers: string[];
    frequency: number;
    strength: number; // 0-1 scale
    lastDetected: Date;
  };
  metrics: {
    confidence: number;
    supportCount: number;
    accuracy: number;
    consistency: number;
  };
  insights: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Personalization types
export interface LearningStyle {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  strength: number; // 0-1 scale
  preferences: {
    contentFormats: string[];
    interactionTypes: string[];
    difficultyProgression: 'gradual' | 'steep' | 'mixed';
    feedbackFrequency: 'immediate' | 'session_end' | 'periodic';
  };
  adaptationHistory: {
    adaptations: number;
    successfulChanges: number;
    lastAdaptation: Date;
  };
}

export interface PersonalizationProfile {
  userId: string;
  learningStyle: LearningStyle;
  performanceMetrics: {
    overallAccuracy: number;
    subjectPerformance: Record<string, {
      accuracy: number;
      speed: number;
      improvement: number;
      lastActivity: Date;
    }>;
    sessionPatterns: {
      averageSessionLength: number;
      peakLearningHours: string[];
      preferredSessionLength: number;
      breakFrequency: number;
    };
  };
  adaptationHistory: {
    lastAdaptation: Date;
    adaptationCount: number;
    successfulAdaptations: number;
    adaptationTypes: Array<{
      type: string;
      date: Date;
      success: number; // 0-1 scale
      impact: string;
    }>;
  };
  preferences: {
    responseStyle: 'concise' | 'detailed' | 'step_by_step' | 'interactive';
    explanationDepth: 'basic' | 'intermediate' | 'advanced';
    examplePreference: 'abstract' | 'concrete' | 'real_world';
    interactionPreference: 'socratic' | 'direct' | 'collaborative';
  };
  effectivePatterns: {
    successfulStrategies: string[];
    learningTriggers: string[];
    motivationFactors: string[];
    studyMethods: Array<{
      method: string;
      effectiveness: number;
      context: string;
    }>;
  };
}

// Feedback collection request types
export interface FeedbackCollectionRequest {
  userId: string;
  sessionId: string;
  interactionId: string;
  type: 'comprehensive' | 'quick' | 'rating' | 'correction';
  source: 'explicit' | 'implicit' | 'hybrid';
  explicit?: {
    rating?: number;
    corrections?: any[];
    clarifications?: any[];
    flags?: string[];
    content?: string;
  };
  implicit?: {
    timeSpent?: number;
    scrollDepth?: number;
    followUpQuestions?: number;
    corrections?: number;
    abandonment?: boolean;
  };
  context: any;
  requireAnalysis: boolean;
  requireCorrelations: boolean;
}

// Learning request types
export interface LearningRequest {
  userId: string;
  learningType: 'correction_learning' | 'pattern_recognition' | 'hallucination_detection' | 'quality_optimization' | 'behavioral_adaptation';
  feedbackData: UserFeedback[];
  context?: any;
  targetMetrics?: {
    accuracy: number;
    hallucinationRate: number;
    userSatisfaction: number;
    correctionRate: number;
    engagementScore: number;
    retentionRate: number;
  };
  maxProcessingTime?: number;
  minConfidence?: number;
  requireValidation?: boolean;
}

// Pattern analysis request types
export interface PatternAnalysisRequest {
  userId: string;
  patternType: 'behavioral' | 'feedback' | 'performance' | 'quality' | 'engagement' | 'satisfaction' | 'correction' | 'abandonment';
  timeRange: { start: Date; end: Date };
  dataSource: { primary: string; secondary?: string[] };
  recognitionMethod: 'statistical' | 'machine_learning' | 'rule_based' | 'heuristic' | 'hybrid';
  minConfidence?: number;
  maxPatterns?: number;
  includeCorrelations?: boolean;
  requireValidation?: boolean;
}

// Layer 4 processing result types
export interface Layer4ProcessingResult {
  feedback: Layer4FeedbackResult;
  learning: Layer4LearningResult;
  personalization: Layer4PersonalizationResult;
  patterns: Layer4PatternsResult;
  processingTime: number;
  recommendations: string[];
  warnings: string[];
  metadata: {
    requestId: string;
    timestamp: string;
    processingStages: Layer4ProcessingStage[];
    confidence: number;
    systemState: Layer4SystemState;
  };
}

export interface Layer4FeedbackResult {
  collected: boolean;
  feedbackId?: string;
  satisfaction?: any;
  patterns: any[];
  correlations: any[];
  recommendations: string[];
  insights: string[];
  processingTime: number;
}

export interface Layer4LearningResult {
  learningId?: string;
  insights: any[];
  recommendations: any[];
  modelUpdates: any[];
  validation: any;
  processingTime: number;
}

export interface Layer4PersonalizationResult {
  userProfile: PersonalizationProfile | null;
  personalization: any;
  adaptations: any[];
  confidence: number;
  validation: any;
  processingTime: number;
}

export interface Layer4PatternsResult {
  analysisId?: string;
  patterns: LearningPattern[];
  insights: any[];
  recommendations: any[];
  correlations: any[];
  validation: any;
  processingTime: number;
}

export interface Layer4ProcessingStage {
  stage: 'feedback_collection' | 'pattern_recognition' | 'learning_analysis' | 'personalization' | 'integration';
  status: 'completed' | 'failed' | 'skipped';
  duration: number;
  details?: any;
  error?: string;
}

export interface Layer4SystemState {
  feedbackCollector: boolean;
  learningEngine: boolean;
  personalizationEngine: boolean;
  patternRecognizer: boolean;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  performance: {
    averageResponseTime: number;
    systemAccuracy: number;
    userSatisfaction: number;
    learningProgress: number;
  };
}

// Enhanced study buddy state with Layer 4
export interface StudyBuddyStateLayer4 extends StudyBuddyState {
  layer4Data: {
    userFeedback: UserFeedback[];
    learningPatterns: LearningPattern[];
    personalizationProfile: PersonalizationProfile | null;
    feedbackCollectionEnabled: boolean;
    personalizationEnabled: boolean;
    patternRecognitionEnabled: boolean;
  };
}

// Layer 4 integration methods for study buddy
export interface StudyBuddyActionsLayer4 extends StudyBuddyActions {
  collectStudyFeedback: (feedback: Partial<UserFeedback>) => Promise<void>;
  adaptToLearningStyle: () => Promise<PersonalizationProfile | null>;
  trackLearningProgress: () => Promise<any>;
  recognizeStudyPatterns: () => Promise<LearningPattern[]>;
  enableFeedbackCollection: () => void;
  disableFeedbackCollection: () => void;
  getPersonalizationProfile: () => Promise<PersonalizationProfile | null>;
  updatePersonalizationPreferences: (preferences: Partial<PersonalizationProfile['preferences']>) => Promise<void>;
}

// Study effectiveness metrics
export interface StudyEffectivenessMetrics {
  sessionEffectiveness: number; // 0-1 scale
  learningVelocity: number; // topics per hour
  retentionRate: number; // 0-1 scale
  engagementScore: number; // 0-1 scale
  satisfactionTrend: 'improving' | 'stable' | 'declining';
  adaptationSuccess: number; // 0-1 scale
  recommendedActions: string[];
  nextSessionPreparation: string[];
}