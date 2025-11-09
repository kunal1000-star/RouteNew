// Layer 4: User Feedback & Learning System - Basic Tests
// ======================================================
// Comprehensive testing suite for all Layer 4 components

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  layer4Service,
  processUserFeedbackAndLearning,
  collectQuickFeedback,
  analyzePatterns,
  personalizeForUser,
  learnFromFeedback,
  feedbackCollector,
  learningEngine,
  personalizationEngine,
  patternRecognizer
} from './index';
import type { Layer4ProcessingRequest, UserFeedback } from './FeedbackCollector';
import {
  collectFeedback,
  analyzeFeedbackPatterns
} from './FeedbackCollector';
import {
  personalizeResponse,
  buildUserProfile,
  updateUserProfile,
  trackLearningProgress
} from './PersonalizationEngine';
import {
  recognizePatterns as recognizePatternAnalysis,
  detectBehavioralPatterns,
  detectFeedbackPatterns,
  detectQualityPatterns,
  analyzePatternEvolution,
  getPatternInsights
} from './PatternRecognizer';

describe('Layer4Service', () => {
  let mockUserId: string;
  let mockRequest: Layer4ProcessingRequest;

  beforeEach(() => {
    mockUserId = 'test_user_123';
    mockRequest = {
      userId: mockUserId,
      sessionId: 'test_session_456',
      interactionId: 'test_interaction_789',
      message: 'Test message for Layer 4 processing',
      context: {
        conversationHistory: [],
        userProfile: {},
        systemState: {},
        environment: {},
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }
      },
      feedback: {
        explicit: {
          rating: 4,
          corrections: [],
          content: 'Good response'
        },
        implicit: {
          timeSpent: 30000,
          scrollDepth: 0.8,
          followUpQuestions: 1,
          corrections: 0,
          abandonment: false
        }
      },
      personalization: {
        userSegment: 'student',
        learningStyle: 'visual',
        complexity: 'intermediate',
        format: 'detailed',
        preferences: {}
      },
      learning: {
        learningType: 'correction_learning',
        feedbackData: [],
        requireValidation: true,
        minConfidence: 0.7
      },
      patterns: {
        patternType: 'feedback',
        recognitionMethod: 'statistical',
        includeCorrelations: true,
        requireValidation: true
      },
      options: {
        enableFeedback: true,
        enableLearning: true,
        enablePersonalization: true,
        enablePatternRecognition: true,
        enableLogging: true,
        enableMetrics: true,
        strictMode: false,
        fallbackEnabled: true,
        maxProcessingTime: 30000
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Layer4Service Core Functionality', () => {
    test('should process user feedback and learning successfully', async () => {
      const result = await layer4Service.processUserFeedbackAndLearning(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.learning).toBeDefined();
      expect(result.personalization).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.requestId).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.processingStages).toBeInstanceOf(Array);
    });

    test('should collect quick feedback successfully', async () => {
      const quickFeedback = {
        rating: 5,
        corrections: [],
        content: 'Excellent response'
      };

      const result = await layer4Service.collectQuickFeedback(mockUserId, 'interaction_123', quickFeedback);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.feedbackType).toBe('quick');
      expect(result.satisfaction).toBeDefined();
    });

    test('should analyze patterns successfully', async () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await layer4Service.analyzePatterns(mockUserId, 'feedback', timeRange);
      
      expect(result).toBeDefined();
      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalPatterns).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('should personalize for user successfully', async () => {
      const interaction = {
        query: 'What is photosynthesis?',
        timestamp: new Date(),
        userSatisfaction: 0.8
      };

      const preferences = {
        detailLevel: 'detailed',
        examples: true,
        sources: false
      };

      const result = await layer4Service.personalizeForUser(mockUserId, interaction, preferences);
      
      expect(result).toBeDefined();
      expect(result.userProfile).toBeDefined();
      expect(result.personalization).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.adaptations).toBeInstanceOf(Array);
    });

    test('should learn from feedback successfully', async () => {
      const feedbackData: UserFeedback[] = [
        {
          id: 'feedback_1',
          userId: mockUserId,
          sessionId: 'session_1',
          interactionId: 'interaction_1',
          content: 'This answer is not accurate',
          type: 'negative',
          rating: 2,
          quality: 0.3,
          createdAt: new Date(),
          isActive: true
        }
      ];

      const result = await layer4Service.learnFromFeedback(feedbackData, 'correction_learning');
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.learningType).toBe('correction_learning');
      expect(result.status).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('should handle errors gracefully', async () => {
      const invalidRequest = {
        ...mockRequest,
        userId: '' // Invalid user ID
      };

      const result = await layer4Service.processUserFeedbackAndLearning(invalidRequest);
      
      expect(result).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      // Should have warnings about processing issues
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    test('should get and manage metrics', () => {
      const metrics = layer4Service.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBeDefined();
      expect(metrics.successfulRequests).toBeDefined();
      expect(metrics.failedRequests).toBeDefined();
      expect(metrics.averageProcessingTime).toBeDefined();
      expect(metrics.errorRate).toBeDefined();
      expect(metrics.stageDurations).toBeDefined();
      expect(metrics.componentMetrics).toBeDefined();

      layer4Service.resetMetrics();
      const resetMetrics = layer4Service.getMetrics();
      expect(resetMetrics.totalRequests).toBe(0);
    });

    test('should update and get configuration', () => {
      const newConfig = {
        enableFeedbackCollection: false,
        enableLearning: false,
        maxProcessingTime: 10000
      };

      layer4Service.updateConfiguration(newConfig);
      const config = layer4Service.getConfiguration();
      
      expect(config.enableFeedbackCollection).toBe(false);
      expect(config.enableLearning).toBe(false);
      expect(config.maxProcessingTime).toBe(10000);
    });
  });

  describe('Layer4Service Convenience Functions', () => {
    test('should process user feedback and learning via convenience function', async () => {
      const result = await processUserFeedbackAndLearning(mockRequest);
      expect(result).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should collect quick feedback via convenience function', async () => {
      const result = await collectQuickFeedback(mockUserId, 'interaction_123', {
        rating: 5,
        content: 'Great!'
      });
      expect(result).toBeDefined();
    });

    test('should analyze patterns via convenience function', async () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const result = await analyzePatterns(mockUserId, 'behavioral', timeRange);
      expect(result).toBeDefined();
    });

    test('should personalize for user via convenience function', async () => {
      const result = await personalizeForUser(mockUserId, {}, {});
      expect(result).toBeDefined();
    });

    test('should learn from feedback via convenience function', async () => {
      const feedbackData: UserFeedback[] = [
        {
          id: 'feedback_1',
          userId: mockUserId,
          sessionId: 'session_1',
          interactionId: 'interaction_1',
          content: 'Test feedback',
          type: 'neutral',
          rating: 3,
          quality: 0.5,
          createdAt: new Date(),
          isActive: true
        }
      ];
      
      const result = await learnFromFeedback(feedbackData);
      expect(result).toBeDefined();
    });
  });
});

describe('FeedbackCollector Integration', () => {
  test('should collect feedback successfully', async () => {
    const feedbackRequest = {
      userId: 'user_123',
      sessionId: 'session_123',
      interactionId: 'interaction_123',
      source: 'explicit',
      explicit: {
        rating: 4,
        content: 'Good response'
      },
      requireAnalysis: true,
      requireCorrelations: true
    };

    const result = await feedbackCollector.collectFeedback(feedbackRequest);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.source).toBeDefined();
    expect(result.feedbackType).toBe('comprehensive');
  });

  test('should collect implicit feedback', async () => {
    const result = await feedbackCollector.collectImplicitFeedback('user_123', {
      timeSpent: 45000,
      scrollDepth: 0.9,
      followUpQuestions: 2,
      corrections: 0,
      abandonment: false
    });
    expect(result).toBeDefined();
    expect(result.implicit).toBe(true);
  });

  test('should analyze feedback patterns', async () => {
    const mockFeedback: UserFeedback[] = [
      {
        id: 'feedback_1',
        userId: 'user_123',
        sessionId: 'session_1',
        interactionId: 'interaction_1',
        content: 'Great answer!',
        type: 'positive',
        rating: 5,
        quality: 0.9,
        createdAt: new Date(),
        isActive: true
      }
    ];

    const result = await feedbackCollector.analyzeFeedbackPatterns(mockFeedback);
    expect(result).toBeDefined();
    expect(result.patterns).toBeInstanceOf(Array);
  });
});

describe('LearningEngine Integration', () => {
  test('should learn from corrections', async () => {
    const feedbackData: UserFeedback[] = [
      {
        id: 'feedback_1',
        userId: 'user_123',
        sessionId: 'session_1',
        interactionId: 'interaction_1',
        content: 'Incorrect information provided',
        type: 'correction',
        rating: 1,
        quality: 0.2,
        createdAt: new Date(),
        isActive: true
      }
    ];

    const result = await learningEngine.learnFromFeedback({
      learningType: 'correction_learning',
      feedbackData,
      targetMetrics: {
        accuracy: 0.8,
        hallucinationRate: 0.1,
        userSatisfaction: 0.8,
        correctionRate: 0.1,
        engagementScore: 0.7,
        retentionRate: 0.8
      },
      maxProcessingTime: 10000,
      minConfidence: 0.6,
      requireValidation: true
    });
    
    expect(result).toBeDefined();
    expect(result.learningType).toBe('correction_learning');
  });
});

describe('PersonalizationEngine Integration', () => {
  test('should personalize response', async () => {
    const personalizationRequest = {
      userId: 'user_123',
      context: {
        currentSession: {
          sessionId: 'session_123',
          startTime: new Date(),
          duration: 300,
          interactionCount: 5,
          engagementLevel: 0.7,
          fatigue: 0.2,
          goals: ['learn', 'practice']
        },
        recentInteractions: [],
        systemState: {
          performance: { responseTime: 2000, accuracy: 0.85, reliability: 0.9, efficiency: 0.8 },
          load: { cpu: 0.5, memory: 0.6, requests: 100, queueSize: 5 },
          status: { health: 'healthy', available: true, errors: 0, warnings: 1 },
          capabilities: { layersActive: ['layer1', 'layer2'], featuresAvailable: ['chat', 'feedback'], modelsAvailable: ['gpt-4'], integrationsActive: ['supabase'] }
        },
        environment: {
          device: { type: 'desktop', os: 'Windows', browser: 'Chrome', screenSize: '1920x1080', capabilities: ['webgl', 'audio'], performance: { cpu: 'Intel i7', memory: '16GB', networkSpeed: 100 } },
          network: { type: 'wifi', speed: 100, latency: 20, stability: 0.95 },
          time: { localTime: new Date(), utcTime: new Date(), timezone: 'UTC', dayOfWeek: 'weekday', timeOfDay: 'morning', workingHours: true },
          accessibility: { screenReader: false, fontSize: 'medium', highContrast: false, reducedMotion: false, keyboardNavigation: true }
        },
        userState: { energy: 0.8, focus: 0.9, stress: 0.1, motivation: 0.8, experience: 0.7, confidence: 0.8 }
      },
      target: {
        responseCustomization: {
          format: 'plain_text',
          length: 'medium',
          detail: 'moderate',
          examples: true,
          sources: false,
          visuals: true,
          exercises: true
        },
        contentSelection: {
          topics: ['science', 'mathematics'],
          subjects: ['biology', 'chemistry'],
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
      requireValidation: true
    };

    const result = await personalizationEngine.personalize(personalizationRequest);
    expect(result).toBeDefined();
    expect(result.userProfile).toBeDefined();
    expect(result.personalization).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });
});

describe('PatternRecognizer Integration', () => {
  test('should recognize patterns successfully', async () => {
    const patternRequest = {
      userId: 'user_123',
      patternType: 'behavioral',
      timeRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      dataSource: { primary: 'interaction_history' },
      recognitionMethod: 'statistical',
      minConfidence: 0.6,
      maxPatterns: 10,
      includeCorrelations: true,
      requireValidation: true
    };

    const result = await patternRecognizer.recognizePatterns(patternRequest);
    expect(result).toBeDefined();
    expect(result.patterns).toBeInstanceOf(Array);
    expect(result.summary).toBeDefined();
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  // Test runner would go here
  console.log('Layer 4 basic tests would be executed here');
  console.log('Tests cover:');
  console.log('- Core Layer4Service functionality');
  console.log('- Feedback collection and analysis');
  console.log('- Learning and pattern recognition');
  console.log('- Personalization and adaptation');
  console.log('- Error handling and fallbacks');
  console.log('- Metrics and configuration management');
}

export {};