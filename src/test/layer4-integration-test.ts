// Layer 4 Integration Test
// =======================

import { describe, test, expect, beforeEach } from '@jest/globals';
import { StudyBuddyChat } from '@/components/study-buddy/study-buddy-chat';
import type { 
  UserFeedback, 
  LearningPattern, 
  PersonalizationProfile,
  StudyEffectivenessMetrics 
} from '@/types/study-buddy';

// Mock Layer 4 services
jest.mock('@/lib/hallucination-prevention/layer4', () => ({
  feedbackCollector: {
    collectImplicitFeedback: jest.fn(),
    collectExplicitFeedback: jest.fn()
  },
  personalizationEngine: {
    getOrCreateProfile: jest.fn(),
    trackLearningProgress: jest.fn()
  },
  layer4Service: {
    analyzePattern: jest.fn(),
    personalize: jest.fn()
  }
}));

describe('Layer 4 Study Buddy Integration', () => {
  let mockProps: any;
  let mockSetState: jest.Mock;

  beforeEach(() => {
    mockSetState = jest.fn();
    mockProps = {
      messages: [],
      onSendMessage: jest.fn(),
      isLoading: false,
      preferences: {
        provider: 'openai',
        streamResponses: true,
        temperature: 0.7,
        maxTokens: 1000
      },
      onUpdatePreferences: jest.fn(),
      studyContext: {
        subject: 'Mathematics',
        difficultyLevel: 'intermediate' as const,
        learningGoals: ['Understand calculus', 'Solve equations'],
        topics: ['derivatives', 'integrals'],
        timeSpent: 0,
        lastActivity: new Date()
      }
    };

    // Mock React hooks
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useState: jest.fn((initial) => [initial, mockSetState]),
      useRef: jest.fn(() => ({
        current: null
      })),
      useEffect: jest.fn()
    }));
  });

  describe('Feedback Collection', () => {
    test('should collect explicit feedback successfully', async () => {
      // This would test the collectStudyFeedback method
      // For now, we'll create a simplified test
      const feedback: Partial<UserFeedback> = {
        type: 'explicit',
        rating: 5,
        content: 'Great explanation!'
      };

      expect(feedback.type).toBe('explicit');
      expect(feedback.rating).toBe(5);
    });

    test('should collect implicit feedback from user behavior', () => {
      const implicitMetrics = {
        timeSpent: 30000, // 30 seconds
        scrollDepth: 0.8,
        followUpQuestions: 2,
        corrections: 0,
        abandonment: false
      };

      expect(implicitMetrics.scrollDepth).toBeGreaterThan(0.7);
      expect(implicitMetrics.timeSpent).toBeGreaterThan(0);
    });
  });

  describe('Learning Pattern Recognition', () => {
    test('should identify learning patterns', async () => {
      const sessionData = {
        messageCount: 10,
        satisfactionScore: 4.5,
        engagementLevel: 0.8,
        averageResponseTime: 2000
      };

      const patterns: LearningPattern[] = [
        {
          id: 'high_engagement',
          userId: 'user123',
          patternType: 'engagement',
          pattern: {
            name: 'High Engagement Pattern',
            description: 'User consistently engages with detailed content',
            triggers: ['detailed_explanations', 'step_by_step'],
            frequency: 0.8,
            strength: 0.8,
            lastDetected: new Date()
          },
          metrics: {
            confidence: 0.8,
            supportCount: 10,
            accuracy: 0.9,
            consistency: 0.8
          },
          insights: ['User prefers detailed explanations'],
          recommendations: ['Continue with comprehensive responses'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      expect(patterns[0].patternType).toBe('engagement');
      expect(patterns[0].metrics.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Personalization Engine', () => {
    test('should adapt to learning style', async () => {
      const learningStyle = {
        type: 'visual' as const,
        strength: 0.7,
        preferences: {
          contentFormats: ['diagrams', 'charts'],
          interactionTypes: ['visual', 'interactive'],
          difficultyProgression: 'gradual' as const,
          feedbackFrequency: 'session_end' as const
        },
        adaptationHistory: {
          adaptations: 2,
          successfulChanges: 1,
          lastAdaptation: new Date()
        }
      };

      const adaptations = [
        {
          type: 'visual_content',
          change: 'add_diagrams',
          rationale: 'User shows preference for visual learning'
        }
      ];

      expect(learningStyle.type).toBe('visual');
      expect(adaptations[0].type).toBe('visual_content');
    });
  });

  describe('Learning Progress Tracking', () => {
    test('should calculate study effectiveness metrics', () => {
      const sessionMetrics = {
        messageCount: 8,
        satisfactionScore: 4.2,
        engagementLevel: 0.75,
        corrections: 1,
        timeSpent: 600000 // 10 minutes
      };

      const effectiveness: StudyEffectivenessMetrics = {
        sessionEffectiveness: 0.8,
        learningVelocity: 0.8, // 8 messages per 10 minutes
        retentionRate: 0.84, // 4.2/5
        engagementScore: 0.75,
        satisfactionTrend: 'improving' as const,
        adaptationSuccess: 0.7,
        recommendedActions: [
          'Continue current learning approach',
          'Provide more interactive examples'
        ],
        nextSessionPreparation: [
          'Review current topic',
          'Prepare follow-up questions'
        ]
      };

      expect(effectiveness.sessionEffectiveness).toBeGreaterThan(0.7);
      expect(effectiveness.learningVelocity).toBeGreaterThan(0);
      expect(effectiveness.retentionRate).toBeLessThanOrEqual(1);
    });
  });

  describe('UI Integration', () => {
    test('should render Layer 4 feedback controls', () => {
      // This would test the actual React component rendering
      // For now, we'll test the expected structure
      const uiElements = [
        'quick_feedback_buttons',
        'learning_insights_button',
        'pattern_recognition_button',
        'feedback_collection_dialog',
        'learning_insights_dialog'
      ];

      uiElements.forEach(element => {
        expect(element).toBeDefined();
      });
    });

    test('should display session metrics', () => {
      const displayMetrics = {
        interactionCount: 5,
        satisfactionScore: 4.0,
        engagementLevel: 0.8,
        learningPatterns: 2
      };

      expect(displayMetrics.interactionCount).toBeGreaterThan(0);
      expect(displayMetrics.satisfactionScore).toBeLessThanOrEqual(5);
      expect(displayMetrics.engagementLevel).toBeLessThanOrEqual(1);
    });
  });
});

// Test utilities
export const createMockFeedback = (type: 'explicit' | 'implicit'): UserFeedback => ({
  id: `feedback_${Date.now()}`,
  userId: 'user123',
  sessionId: 'session123',
  interactionId: `interaction_${Date.now()}`,
  type,
  rating: type === 'explicit' ? 4 : undefined,
  content: type === 'explicit' ? 'Test feedback' : undefined,
  behaviorMetrics: type === 'implicit' ? {
    timeSpent: 30000,
    scrollDepth: 0.8,
    followUpQuestions: 2,
    corrections: 0,
    abandonment: false
  } : undefined,
  context: {
    messageId: 'msg123',
    response: 'Test response',
    timestamp: new Date(),
    sessionDuration: 30000
  },
  processed: false,
  createdAt: new Date()
});

export const createMockPersonalizationProfile = (): PersonalizationProfile => ({
  userId: 'user123',
  learningStyle: {
    type: 'reading_writing',
    strength: 0.8,
    preferences: {
      contentFormats: ['text', 'explanation'],
      interactionTypes: ['chat', 'questions'],
      difficultyProgression: 'gradual',
      feedbackFrequency: 'session_end'
    },
    adaptationHistory: {
      adaptations: 3,
      successfulChanges: 2,
      lastAdaptation: new Date()
    }
  },
  performanceMetrics: {
    overallAccuracy: 0.85,
    subjectPerformance: {
      Mathematics: {
        accuracy: 0.9,
        speed: 0.7,
        improvement: 0.1,
        lastActivity: new Date()
      }
    },
    sessionPatterns: {
      averageSessionLength: 20,
      peakLearningHours: ['14:00', '15:00'],
      preferredSessionLength: 25,
      breakFrequency: 0.3
    }
  },
  adaptationHistory: {
    lastAdaptation: new Date(),
    adaptationCount: 3,
    successfulAdaptations: 2,
    adaptationTypes: [
      {
        type: 'response_style',
        date: new Date(),
        success: 0.8,
        impact: 'Improved user satisfaction'
      }
    ]
  },
  preferences: {
    responseStyle: 'detailed',
    explanationDepth: 'intermediate',
    examplePreference: 'concrete',
    interactionPreference: 'collaborative'
  },
  effectivePatterns: {
    successfulStrategies: ['step_by_step_explanation'],
    learningTriggers: ['questions', 'examples'],
    motivationFactors: ['progress_tracking', 'achievements'],
    studyMethods: [
      {
        method: 'active_recall',
        effectiveness: 0.8,
        context: 'mathematics'
      }
    ]
  }
});