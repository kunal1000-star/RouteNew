// Layer 4: User Feedback & Learning System - Main Exports
// =======================================================

// Core component exports
export { FeedbackCollector, feedbackCollector } from './FeedbackCollector';
export { LearningEngine, learningEngine } from './LearningEngine';
export { PersonalizationEngine, personalizationEngine } from './PersonalizationEngine';
export { PatternRecognizer, patternRecognizer } from './PatternRecognizer';

// Utility exports from components
export { 
  collectFeedback, 
  collectImplicitFeedback, 
  analyzeFeedbackPatterns, 
  trackUserSatisfaction, 
  identifyCommonIssues, 
  correlateFeedbackWithQuality 
} from './FeedbackCollector';

export {
  learnFromFeedback as learnFromFeedbackData,
  analyzeCorrections,
  recognizePatterns as recognizePatternData,
  detectHallucinations
} from './LearningEngine';

export { 
  personalizeResponse, 
  buildUserProfile, 
  updateUserProfile, 
  trackLearningProgress 
} from './PersonalizationEngine';

export { 
  recognizePatterns, 
  detectBehavioralPatterns, 
  detectFeedbackPatterns, 
  detectQualityPatterns, 
  analyzePatternEvolution, 
  getPatternInsights 
} from './PatternRecognizer';

// Unified Layer 4 Service
import { feedbackCollector, type FeedbackCollectionRequest, type UserFeedback, type SatisfactionTrend } from './FeedbackCollector';
import { learningEngine, type LearningRequest, type LearningResult } from './LearningEngine';
import { personalizationEngine, type PersonalizationRequest, type PersonalizationResult } from './PersonalizationEngine';
import { patternRecognizer, type PatternAnalysisRequest, type PatternAnalysisResult } from './PatternRecognizer';
import { logError, logWarning, logInfo } from '@/lib/error-logger';
import type { Database } from '@/lib/database.types';

export interface Layer4ProcessingRequest {
  userId: string;
  sessionId?: string;
  interactionId?: string;
  message: string;
  context: Layer4Context;
  feedback: Layer4Feedback;
  personalization: Layer4Personalization;
  learning: Layer4Learning;
  patterns: Layer4Patterns;
  options?: Layer4Options;
  metadata?: Record<string, any>;
}

export interface Layer4Context {
  conversationHistory: any[];
  userProfile: any;
  systemState: any;
  environment: any;
  timeRange: { start: Date; end: Date };
}

export interface Layer4Feedback {
  explicit: {
    rating?: number;
    corrections?: any[];
    clarifications?: any[];
    flags?: string[];
    content?: string;
  };
  implicit: {
    timeSpent?: number;
    scrollDepth?: number;
    followUpQuestions?: number;
    corrections?: number;
    abandonment?: boolean;
  };
}

export interface Layer4Personalization {
  userSegment?: string;
  learningStyle?: string;
  complexity?: string;
  format?: string;
  preferences: any;
}

export interface Layer4Learning {
  learningType: 'correction_learning' | 'pattern_recognition' | 'hallucination_detection' | 'quality_optimization' | 'behavioral_adaptation';
  feedbackData: UserFeedback[];
  requireValidation: boolean;
  minConfidence: number;
}

export interface Layer4Patterns {
  patternType: 'behavioral' | 'feedback' | 'performance' | 'quality' | 'engagement' | 'satisfaction' | 'correction' | 'abandonment';
  recognitionMethod: 'statistical' | 'machine_learning' | 'rule_based' | 'heuristic' | 'hybrid';
  includeCorrelations: boolean;
  requireValidation: boolean;
}

export interface Layer4Options {
  enableFeedback: boolean;
  enableLearning: boolean;
  enablePersonalization: boolean;
  enablePatternRecognition: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  strictMode: boolean;
  fallbackEnabled: boolean;
  maxProcessingTime: number;
}

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
  satisfaction?: SatisfactionTrend;
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
  userProfile: any;
  personalization: any;
  adaptations: any[];
  confidence: number;
  validation: any;
  processingTime: number;
}

export interface Layer4PatternsResult {
  analysisId?: string;
  patterns: any[];
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

export interface Layer4Configuration {
  defaultFeedbackMethods: string[];
  defaultLearningTypes: string[];
  defaultPatternMethods: string[];
  defaultPersonalizationLevel: string;
  enableFeedbackCollection: boolean;
  enableLearning: boolean;
  enablePersonalization: boolean;
  enablePatternRecognition: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  maxProcessingTime: number;
  strictMode: boolean;
  fallbackEnabled: boolean;
}

export interface Layer4Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  errorRate: number;
  stageDurations: {
    feedbackCollection: number[];
    patternRecognition: number[];
    learningAnalysis: number[];
    personalization: number[];
    integration: number[];
  };
  componentMetrics: {
    feedbackCollector: any;
    learningEngine: any;
    personalizationEngine: any;
    patternRecognizer: any;
  };
}

export class Layer4Service {
  private configuration: Layer4Configuration;
  private metrics: Layer4Metrics;
  private requestIdCounter: number = 0;
  private cryptoKey: string;

  constructor(config?: Partial<Layer4Configuration>) {
    this.configuration = {
      defaultFeedbackMethods: ['explicit', 'implicit'],
      defaultLearningTypes: ['correction_learning', 'pattern_recognition'],
      defaultPatternMethods: ['statistical', 'machine_learning'],
      defaultPersonalizationLevel: 'adaptive',
      enableFeedbackCollection: true,
      enableLearning: true,
      enablePersonalization: true,
      enablePatternRecognition: true,
      enableLogging: true,
      enableMetrics: true,
      maxProcessingTime: 30000,
      strictMode: false,
      fallbackEnabled: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.cryptoKey = process.env.LAYER4_ENCRYPTION_KEY || 'default-layer4-key';
  }

  /**
   * Main Layer 4 processing method - orchestrates all Layer 4 components
   */
  async processUserFeedbackAndLearning(request: Layer4ProcessingRequest): Promise<Layer4ProcessingResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const processingStages: Layer4ProcessingStage[] = [];
    
    try {
      logInfo('Layer 4 processing started', {
        componentName: 'Layer4Service',
        requestId,
        userId: request.userId,
        sessionId: request.sessionId,
        interactionId: request.interactionId
      });

      // Step 1: Feedback Collection
      const feedbackStage = await this.executeStage('feedback_collection', async () => {
        if (!this.configuration.enableFeedbackCollection) {
          return { 
            collected: false, 
            processingTime: 0, 
            recommendations: ['Feedback collection disabled'],
            insights: [],
            patterns: [],
            correlations: []
          };
        }

        try {
          const feedbackRequest: FeedbackCollectionRequest = {
            userId: request.userId,
            sessionId: request.sessionId || this.generateSessionId(),
            interactionId: request.interactionId || this.generateInteractionId(),
            type: 'comprehensive',
            source: 'hybrid',
            explicit: request.feedback.explicit,
            implicit: request.feedback.implicit,
            context: request.context,
            requireAnalysis: true,
            requireCorrelations: true
          };

          const feedbackResult = await feedbackCollector.collectFeedback(feedbackRequest);
          
          return {
            collected: true,
            feedbackId: feedbackResult.id,
            patterns: [],
            correlations: [],
            recommendations: [],
            insights: [],
            processingTime: 0
          };
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), {
            componentName: 'Layer4Service',
            operation: 'feedback_collection',
            userId: request.userId
          });
          
          return {
            collected: false,
            processingTime: 0,
            recommendations: ['Feedback collection failed'],
            insights: [],
            patterns: [],
            correlations: []
          };
        }
      });

      processingStages.push(feedbackStage);

      // Step 2: Pattern Recognition
      const patternsStage = await this.executeStage('pattern_recognition', async () => {
        if (!this.configuration.enablePatternRecognition) {
          return {
            patterns: [],
            insights: [],
            recommendations: [],
            correlations: [],
            validation: { isValid: false },
            processingTime: 0
          };
        }

        try {
          const patternRequest: PatternAnalysisRequest = {
            userId: request.userId,
            patternType: request.patterns.patternType,
            timeRange: request.context.timeRange,
            dataSource: { primary: 'user_feedback' },
            recognitionMethod: request.patterns.recognitionMethod,
            minConfidence: 0.6,
            maxPatterns: 20,
            includeCorrelations: request.patterns.includeCorrelations,
            requireValidation: request.patterns.requireValidation
          };

          const patternResult = await patternRecognizer.recognizePatterns(patternRequest);
          
          return {
            patterns: patternResult.patterns,
            insights: patternResult.insights,
            recommendations: patternResult.recommendations,
            correlations: patternResult.correlations,
            validation: patternResult.validation,
            processingTime: 0
          };
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), {
            componentName: 'Layer4Service',
            operation: 'pattern_recognition',
            userId: request.userId
          });
          
          return {
            patterns: [],
            insights: [],
            recommendations: [],
            correlations: [],
            validation: { isValid: false },
            processingTime: 0
          };
        }
      });

      processingStages.push(patternsStage);

      // Step 3: Learning Analysis
      const learningStage = await this.executeStage('learning_analysis', async () => {
        if (!this.configuration.enableLearning) {
          return {
            learningId: undefined,
            insights: [],
            recommendations: [],
            modelUpdates: [],
            validation: { isValid: false },
            processingTime: 0
          };
        }

        try {
          const learningRequest: LearningRequest = {
            userId: request.userId,
            learningType: request.learning.learningType,
            feedbackData: request.learning.feedbackData,
            context: await this.buildLearningContext(request),
            targetMetrics: {
              accuracy: 0,
              hallucinationRate: 0,
              userSatisfaction: 0,
              correctionRate: 0,
              engagementScore: 0,
              retentionRate: 0
            },
            maxProcessingTime: 15000,
            minConfidence: request.learning.minConfidence,
            requireValidation: request.learning.requireValidation
          };

          const learningResult = await learningEngine.learnFromFeedback(learningRequest);
          
          return {
            learningId: learningResult.id,
            insights: learningResult.insights,
            recommendations: learningResult.recommendations,
            modelUpdates: learningResult.implementation?.components || [],
            validation: learningResult.validationResults || [],
            processingTime: 0
          };
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), {
            componentName: 'Layer4Service',
            operation: 'learning_analysis',
            userId: request.userId
          });
          
          return {
            learningId: undefined,
            insights: [],
            recommendations: [],
            modelUpdates: [],
            validation: { isValid: false },
            processingTime: 0
          };
        }
      });

      processingStages.push(learningStage);

      // Step 4: Personalization
      const personalizationStage = await this.executeStage('personalization', async () => {
        if (!this.configuration.enablePersonalization) {
          return {
            userProfile: null,
            personalization: null,
            adaptations: [],
            confidence: 0,
            validation: { isValid: false },
            processingTime: 0
          };
        }

        try {
          const personalizationRequest: PersonalizationRequest = {
            userId: request.userId,
            context: await this.buildPersonalizationContext(request),
            target: await this.buildPersonalizationTarget(request),
            constraints: {
              maxResponseTime: 5000,
              maxComplexity: 'intermediate',
              minQuality: 0.7,
              maxCorrectionRate: 0.1,
              privacy: { dataCollection: 'moderate', personalization: 'basic', sharing: 'anonymized', retention: 'short' },
              accessibility: { screenReader: false, fontSize: 'medium', highContrast: false, reducedMotion: false, keyboardNavigation: true },
              systemLimitations: []
            },
            priority: 'medium',
            maxProcessingTime: 10000,
            requireValidation: true
          };

          const personalizationResult = await personalizationEngine.personalize(personalizationRequest);
          
          return {
            userProfile: personalizationResult.userProfile,
            personalization: personalizationResult.personalization,
            adaptations: personalizationResult.adaptations,
            confidence: personalizationResult.confidence,
            validation: personalizationResult.validation,
            processingTime: 0
          };
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), {
            componentName: 'Layer4Service',
            operation: 'personalization',
            userId: request.userId
          });
          
          return {
            userProfile: null,
            personalization: null,
            adaptations: [],
            confidence: 0,
            validation: { isValid: false },
            processingTime: 0
          };
        }
      });

      processingStages.push(personalizationStage);

      // Step 5: Integration and Final Recommendations
      const integrationStage = await this.executeStage('integration', async () => {
        const recommendations = this.generateFinalRecommendations(feedbackStage, patternsStage, learningStage, personalizationStage, request);
        const warnings = this.generateFinalWarnings(feedbackStage, patternsStage, learningStage, personalizationStage, request);
        const systemState = this.createSystemState(feedbackStage, patternsStage, learningStage, personalizationStage);
        
        return {
          recommendations,
          warnings,
          systemState,
          processingTime: 0
        };
      });

      processingStages.push(integrationStage);

      const processingTime = Date.now() - startTime;
      
      const result: Layer4ProcessingResult = {
        feedback: feedbackStage.details as Layer4FeedbackResult,
        learning: learningStage.details as Layer4LearningResult,
        personalization: personalizationStage.details as Layer4PersonalizationResult,
        patterns: patternsStage.details as Layer4PatternsResult,
        processingTime,
        recommendations: integrationStage.details?.recommendations || [],
        warnings: integrationStage.details?.warnings || [],
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingStages,
          confidence: this.calculateOverallConfidence(processingStages),
          systemState: integrationStage.details?.systemState || this.createFallbackSystemState()
        }
      };

      // Update metrics
      this.updateMetrics(result, processingTime, true);

      logInfo('Layer 4 processing completed successfully', {
        componentName: 'Layer4Service',
        requestId,
        processingTime,
        userId: request.userId,
        success: true
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorResult = this.createErrorResult(request, {
        stage: 'integration',
        status: 'failed',
        duration: processingTime,
        error: error instanceof Error ? error.message : String(error)
      }, requestId);

      this.updateMetrics(errorResult, processingTime, false);

      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer4Service',
        requestId,
        processingTime,
        userId: request.userId
      });

      return errorResult;
    }
  }

  /**
   * Quick feedback collection - for real-time scenarios
   */
  async collectQuickFeedback(
    userId: string,
    interactionId: string,
    feedback: { rating?: number; corrections?: any[]; content?: string }
  ): Promise<any> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (!this.configuration.enableFeedbackCollection) {
        return { collected: false, message: 'Feedback collection disabled' };
      }

      const feedbackRequest: FeedbackCollectionRequest = {
        userId,
        sessionId: this.generateSessionId(),
        interactionId,
        type: 'rating',
        source: 'explicit',
        explicit: { rating: feedback.rating, corrections: feedback.corrections, content: feedback.content },
        context: {},
        requireAnalysis: false,
        requireCorrelations: false
      };

      const result = await feedbackCollector.collectFeedback(feedbackRequest);

      logInfo('Quick feedback collection completed', {
        componentName: 'Layer4Service',
        requestId,
        userId,
        interactionId,
        rating: feedback.rating,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer4Service',
        operation: 'collect_quick_feedback',
        requestId,
        userId,
        interactionId
      });

      return { collected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Pattern analysis only - for specific pattern types
   */
  async analyzePatterns(
    userId: string,
    patternType: 'behavioral' | 'feedback' | 'quality',
    timeRange: { start: Date; end: Date }
  ): Promise<PatternAnalysisResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (!this.configuration.enablePatternRecognition) {
        throw new Error('Pattern recognition is disabled');
      }

      const patternRequest: PatternAnalysisRequest = {
        userId,
        patternType,
        timeRange,
        dataSource: { primary: 'interaction_history' },
        recognitionMethod: 'statistical',
        minConfidence: 0.6,
        maxPatterns: 20,
        includeCorrelations: true,
        requireValidation: false
      };

      const result = await patternRecognizer.recognizePatterns(patternRequest);

      logInfo('Pattern analysis completed', {
        componentName: 'Layer4Service',
        requestId,
        userId,
        patternType,
        patternCount: result.patterns.length,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer4Service',
        operation: 'analyze_patterns',
        requestId,
        userId,
        patternType
      });

      throw new Error(`Pattern analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Personalization only - for user profile updates
   */
  async personalizeForUser(
    userId: string,
    interaction: any,
    preferences: any
  ): Promise<PersonalizationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (!this.configuration.enablePersonalization) {
        throw new Error('Personalization is disabled');
      }

      // Build minimal context
      const context = {
        currentSession: {
          sessionId: this.generateSessionId(),
          startTime: new Date(),
          duration: 0,
          interactionCount: 1,
          engagementLevel: 0.5,
          fatigue: 0,
          goals: []
        },
        recentInteractions: [],
        systemState: {
          performance: { responseTime: 2000, accuracy: 0.8, reliability: 0.9, efficiency: 0.8 },
          load: { cpu: 0.5, memory: 0.6, requests: 0, queueSize: 0 },
          status: { health: 'healthy', available: true, errors: 0, warnings: 0 },
          capabilities: { layersActive: [], featuresAvailable: [], modelsAvailable: [], integrationsActive: [] }
        },
        environment: {
          device: { type: 'desktop', os: 'unknown', browser: 'unknown', screenSize: 'unknown', capabilities: [], performance: { cpu: 'unknown', memory: 'unknown', networkSpeed: 0 } },
          network: { type: 'wifi', speed: 0, latency: 0, stability: 0.8 },
          time: { localTime: new Date(), utcTime: new Date(), timezone: 'UTC', dayOfWeek: 'unknown', timeOfDay: 'unknown', workingHours: true },
          accessibility: { screenReader: false, fontSize: 'medium', highContrast: false, reducedMotion: false, keyboardNavigation: true }
        },
        userState: { energy: 0.5, focus: 0.5, stress: 0.1, motivation: 0.5, experience: 0.5, confidence: 0.5 }
      };

      const personalizationRequest: PersonalizationRequest = {
        userId,
        context,
        target: {
          responseCustomization: {
            format: 'plain_text',
            length: 'medium',
            detail: 'moderate',
            examples: true,
            sources: false,
            visuals: false,
            exercises: false
          },
          contentSelection: {
            topics: [],
            subjects: [],
            difficulty: 'intermediate',
            scope: 'moderate',
            novelty: 0.3,
            relevance: 0.8
          },
          interactionStyle: {
            pace: 'moderate',
            guidance: 'moderate',
            questions: 'moderate',
            feedback: 'immediate'
          },
          adaptationStrategy: {
            learningRate: 0.5,
            adaptationFrequency: 'occasional',
            stability: 0.7,
            exploration: 0.3,
            personalization: 0.8
          }
        },
        constraints: {
          maxResponseTime: 5000,
          maxComplexity: 'intermediate',
          minQuality: 0.7,
          maxCorrectionRate: 0.1,
          privacy: { dataCollection: 'moderate', personalization: 'basic', sharing: 'anonymized', retention: 'short' },
          accessibility: { screenReader: false, fontSize: 'medium', highContrast: false, reducedMotion: false, keyboardNavigation: true },
          systemLimitations: []
        },
        priority: 'medium',
        maxProcessingTime: 10000,
        requireValidation: false
      };

      const result = await personalizationEngine.personalize(personalizationRequest);

      logInfo('User personalization completed', {
        componentName: 'Layer4Service',
        requestId,
        userId,
        confidence: result.confidence,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer4Service',
        operation: 'personalize_for_user',
        requestId,
        userId
      });

      throw new Error(`User personalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Learning from feedback only - for immediate model improvements
   */
  async learnFromFeedback(
    feedback: UserFeedback[],
    learningType: 'correction_learning' | 'pattern_recognition' | 'hallucination_detection' = 'correction_learning'
  ): Promise<LearningResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (!this.configuration.enableLearning) {
        throw new Error('Learning is disabled');
      }

      const learningRequest: LearningRequest = {
        learningType,
        feedbackData: feedback,
        targetMetrics: {
          accuracy: 0,
          hallucinationRate: 0,
          userSatisfaction: 0,
          correctionRate: 0,
          engagementScore: 0,
          retentionRate: 0
        },
        maxProcessingTime: 20000,
        minConfidence: 0.7,
        requireValidation: true
      };

      const result = await learningEngine.learnFromFeedback(learningRequest);

      logInfo('Learning from feedback completed', {
        componentName: 'Layer4Service',
        requestId,
        learningType,
        feedbackCount: feedback.length,
        confidence: result.confidence,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer4Service',
        operation: 'learn_from_feedback',
        requestId,
        learningType
      });

      throw new Error(`Learning from feedback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Layer4Metrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<Layer4Configuration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): Layer4Configuration {
    return { ...this.configuration };
  }

  // Private helper methods

  private async executeStage<T>(
    stage: Layer4ProcessingStage['stage'],
    operation: () => Promise<T>
  ): Promise<Layer4ProcessingStage & { details?: T; error?: string }> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      return {
        stage,
        status: 'completed',
        duration,
        details: result as any
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        stage,
        status: 'failed',
        duration,
        error: errorMessage
      } as any;
    }
  }

  private createErrorResult(
    request: Layer4ProcessingRequest,
    failedStage: Layer4ProcessingStage,
    requestId: string
  ): Layer4ProcessingResult {
    return {
      feedback: {
        collected: false,
        processingTime: failedStage.duration,
        recommendations: ['Please try again or contact support if the issue persists.'],
        insights: [],
        patterns: [],
        correlations: []
      },
      learning: {
        insights: [],
        recommendations: [],
        modelUpdates: [],
        validation: { isValid: false },
        processingTime: failedStage.duration
      },
      personalization: {
        userProfile: null,
        personalization: null,
        adaptations: [],
        confidence: 0,
        validation: { isValid: false },
        processingTime: failedStage.duration
      },
      patterns: {
        patterns: [],
        insights: [],
        recommendations: [],
        correlations: [],
        validation: { isValid: false },
        processingTime: failedStage.duration
      },
      processingTime: failedStage.duration,
      recommendations: ['Please try again or contact support if the issue persists.'],
      warnings: [`Processing failed at ${failedStage.stage} stage: ${failedStage.error}`],
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingStages: [failedStage],
        confidence: 0,
        systemState: this.createFallbackSystemState()
      }
    };
  }

  private generateFinalRecommendations(
    feedback: any,
    patterns: any,
    learning: any,
    personalization: any,
    request: Layer4ProcessingRequest
  ): string[] {
    const recommendations: string[] = [];

    if (feedback?.status === 'failed') {
      recommendations.push('Consider improving feedback collection mechanisms');
    }

    if (patterns?.patterns && patterns.patterns.length > 0) {
      recommendations.push(`Review ${patterns.patterns.length} identified patterns for actionable insights`);
    }

    if (learning?.recommendations && learning.recommendations.length > 0) {
      recommendations.push(`Implement ${learning.recommendations.length} learning-based improvements`);
    }

    if (personalization?.confidence && personalization.confidence > 0.8) {
      recommendations.push('High personalization confidence - consider expanding adaptive features');
    }

    return recommendations;
  }

  private generateFinalWarnings(
    feedback: any,
    patterns: any,
    learning: any,
    personalization: any,
    request: Layer4ProcessingRequest
  ): string[] {
    const warnings: string[] = [];

    if (feedback?.status === 'failed') {
      warnings.push('Feedback collection failed - may impact learning accuracy');
    }

    if (patterns?.status === 'failed') {
      warnings.push('Pattern recognition failed - may miss important behavioral insights');
    }

    if (learning?.status === 'failed') {
      warnings.push('Learning analysis failed - may prevent system improvements');
    }

    if (personalization?.status === 'failed') {
      warnings.push('Personalization failed - user experience may not be optimized');
    }

    return warnings;
  }

  private createSystemState(feedback: any, patterns: any, learning: any, personalization: any): Layer4SystemState {
    return {
      feedbackCollector: feedback?.status === 'completed',
      learningEngine: learning?.status === 'completed',
      personalizationEngine: personalization?.status === 'completed',
      patternRecognizer: patterns?.status === 'completed',
      healthStatus: this.determineHealthStatus(feedback, patterns, learning, personalization),
      performance: {
        averageResponseTime: 2000,
        systemAccuracy: 0.85,
        userSatisfaction: 0.8,
        learningProgress: 0.7
      }
    };
  }

  private determineHealthStatus(feedback: any, patterns: any, learning: any, personalization: any): 'healthy' | 'degraded' | 'unhealthy' {
    const completed = [feedback, patterns, learning, personalization].filter(s => s?.status === 'completed').length;
    const total = 4;
    
    if (completed === total) return 'healthy';
    if (completed >= total * 0.75) return 'degraded';
    return 'unhealthy';
  }

  private createFallbackSystemState(): Layer4SystemState {
    return {
      feedbackCollector: false,
      learningEngine: false,
      personalizationEngine: false,
      patternRecognizer: false,
      healthStatus: 'unhealthy',
      performance: {
        averageResponseTime: 0,
        systemAccuracy: 0,
        userSatisfaction: 0,
        learningProgress: 0
      }
    };
  }

  private calculateOverallConfidence(stages: Layer4ProcessingStage[]): number {
    if (stages.length === 0) return 0;
    const completedStages = stages.filter(s => s.status === 'completed');
    return completedStages.length / stages.length;
  }

  private async buildLearningContext(request: Layer4ProcessingRequest): Promise<any> {
    return {
      systemVersion: '1.0.0',
      modelVersion: '1.0.0',
      layerVersions: {
        layer1: '1.0.0',
        layer2: '1.0.0',
        layer3: '1.0.0'
      },
      performanceBaseline: {
        responseAccuracy: 0.85,
        factCheckPassRate: 0.90,
        contradictionDetectionRate: 0.80,
        confidenceScoringAccuracy: 0.75,
        userSatisfactionScore: 0.80,
        averageResponseTime: 2000,
        systemUptime: 0.99,
        timestamp: new Date()
      },
      userPopulation: {
        totalUsers: 1000,
        activeUsers: 800,
        userSegments: [],
        demographicDistribution: {},
        usagePatterns: {
          averageSessionLength: 15,
          peakUsageHours: [10, 14, 20],
          featureUsageRates: {},
          commonInteractionTypes: []
        }
      },
      temporalContext: {
        timeOfDay: 'morning',
        dayOfWeek: 'weekday',
        season: 'winter',
        recentEvents: [],
        systemLoad: 0.5
      }
    };
  }

  private async buildPersonalizationContext(request: Layer4ProcessingRequest): Promise<any> {
    return {
      currentSession: {
        sessionId: request.sessionId || this.generateSessionId(),
        startTime: new Date(),
        duration: 0,
        interactionCount: 1,
        engagementLevel: 0.5,
        fatigue: 0,
        goals: []
      },
      recentInteractions: request.context.conversationHistory || [],
      systemState: request.context.systemState || {},
      environment: request.context.environment || {},
      userState: { energy: 0.5, focus: 0.5, stress: 0.1, motivation: 0.5, experience: 0.5, confidence: 0.5 }
    };
  }

  private async buildPersonalizationTarget(request: Layer4ProcessingRequest): Promise<any> {
    return {
      responseCustomization: {
        format: request.personalization.format || 'plain_text',
        length: 'medium',
        detail: 'moderate',
        examples: true,
        sources: false,
        visuals: false,
        exercises: false
      },
      contentSelection: {
        topics: [],
        subjects: [],
        difficulty: request.personalization.complexity || 'intermediate',
        scope: 'moderate',
        novelty: 0.3,
        relevance: 0.8
      },
      interactionStyle: {
        pace: 'moderate',
        guidance: 'moderate',
        questions: 'moderate',
        feedback: 'immediate'
      },
      adaptationStrategy: {
        learningRate: 0.5,
        adaptationFrequency: 'occasional',
        stability: 0.7,
        exploration: 0.3,
        personalization: 0.8
      }
    };
  }

  private updateMetrics(result: Layer4ProcessingResult, processingTime: number, success: boolean): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (!success) {
      this.metrics.errorRate++;
    }

    // Update average processing time
    this.metrics.averageProcessingTime = (
      (this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1)) + processingTime
    ) / this.metrics.totalRequests;

    // Update stage durations
    for (const stage of result.metadata.processingStages) {
      const stageKey = stage.stage.replace('_', '') as keyof typeof this.metrics.stageDurations;
      if (this.metrics.stageDurations[stageKey]) {
        this.metrics.stageDurations[stageKey].push(stage.duration);
        
        // Keep only last 100 measurements
        if (this.metrics.stageDurations[stageKey].length > 100) {
          this.metrics.stageDurations[stageKey].shift();
        }
      }
    }
  }

  private initializeMetrics(): Layer4Metrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      stageDurations: {
        feedbackCollection: [],
        patternRecognition: [],
        learningAnalysis: [],
        personalization: [],
        integration: []
      },
      componentMetrics: {
        feedbackCollector: {},
        learningEngine: {},
        personalizationEngine: {},
        patternRecognizer: {}
      }
    };
  }

  private generateRequestId(): string {
    return `layer4_${Date.now()}_${++this.requestIdCounter}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const layer4Service = new Layer4Service();

// Convenience functions
export const processUserFeedbackAndLearning = (request: Layer4ProcessingRequest) =>
  layer4Service.processUserFeedbackAndLearning(request);

export const collectQuickFeedback = (
  userId: string,
  interactionId: string,
  feedback: { rating?: number; corrections?: any[]; content?: string }
) => layer4Service.collectQuickFeedback(userId, interactionId, feedback);

export const analyzePatterns = (
  userId: string,
  patternType: 'behavioral' | 'feedback' | 'quality',
  timeRange: { start: Date; end: Date }
) => layer4Service.analyzePatterns(userId, patternType, timeRange);

export const personalizeForUser = (
  userId: string,
  interaction: any,
  preferences: any
) => layer4Service.personalizeForUser(userId, interaction, preferences);

export const learnFromFeedback = (
  feedback: UserFeedback[],
  learningType?: 'correction_learning' | 'pattern_recognition' | 'hallucination_detection'
) => layer4Service.learnFromFeedback(feedback, learningType);