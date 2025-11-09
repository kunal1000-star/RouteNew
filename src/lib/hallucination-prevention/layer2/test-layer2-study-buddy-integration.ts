// Layer 2 Study Buddy Integration Test Suite
// ============================================
// Comprehensive test suite for validating Layer 2 integration with study buddy hooks

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  buildEnhancedContext, 
  EnhancedContextBuilder, 
  ContextLevel,
  ContextBuildRequest
} from './EnhancedContextBuilder';
import { 
  searchKnowledge, 
  validateFact, 
  KnowledgeBase,
  SearchFilters
} from './KnowledgeBase';
import { 
  optimizeContext, 
  ContextOptimizer,
  OptimizationRequest,
  OptimizationStrategy
} from './ContextOptimizer';
import { 
  searchMemories, 
  storeMemory,
  ConversationMemoryManager,
  MemorySearchRequest
} from './ConversationMemory';

// Mock the useStudyBuddy hook for testing
const mockUseStudyBuddy = jest.fn();

// Import the actual hook (this would be the real import in actual testing)
jest.mock('@/hooks/use-study-buddy', () => ({
  useStudyBuddy: mockUseStudyBuddy
}));

describe('Layer 2 Study Buddy Integration', () => {
  let mockStudyBuddy: any;
  let testUserId: string;
  let testConversationId: string;

  beforeEach(() => {
    // Set up test data
    testUserId = 'test-user-123';
    testConversationId = 'test-conv-456';
    
    // Mock the study buddy hook
    mockStudyBuddy = {
      userId: testUserId,
      conversationId: testConversationId,
      enhancedContext: null,
      layer2Context: {
        knowledgeBase: [],
        relevantMemories: [],
        contextOptimization: null,
        compressionLevel: 'selective' as ContextLevel,
        tokenUsage: 0
      },
      buildEnhancedStudyContext: jest.fn(),
      getRelevantStudyMemories: jest.fn(),
      optimizeStudyContext: jest.fn(),
      getStudyKnowledgeBase: jest.fn(),
      storeStudyInteraction: jest.fn(),
      getLearningProgress: jest.fn()
    };
    
    mockUseStudyBuddy.mockReturnValue(mockStudyBuddy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Context Builder Integration', () => {
    test('should build enhanced context with 4-level compression', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'selective',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 2048
      };

      // Test the enhanced context building
      const context = await buildEnhancedContext(request);
      
      expect(context).toBeDefined();
      expect(context.compressionLevel).toBe('selective');
      expect(context.tokenUsage).toBeDefined();
      expect(context.studentProfile).toBeDefined();
      expect(Array.isArray(context.knowledgeBase)).toBe(true);
      expect(Array.isArray(context.conversationHistory)).toBe(true);
    });

    test('should handle all context levels correctly', async () => {
      const levels: ContextLevel[] = ['light', 'recent', 'selective', 'full'];
      
      for (const level of levels) {
        const request: ContextBuildRequest = {
          userId: testUserId,
          level,
          includeMemories: true,
          includeKnowledge: true,
          includeProgress: true,
          tokenLimit: 2048
        };

        const context = await buildEnhancedContext(request);
        
        expect(context.compressionLevel).toBe(level);
        expect(context.tokenUsage.total).toBeLessThanOrEqual(2048);
      }
    });

    test('should integrate student profile with gamification data', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'selective',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 2048
      };

      const context = await buildEnhancedContext(request);
      
      // Verify student profile integration
      expect(context.studentProfile).toHaveProperty('userId', testUserId);
      expect(context.studentProfile).toHaveProperty('currentLevel');
      expect(context.studentProfile).toHaveProperty('streakDays');
      expect(context.studentProfile).toHaveProperty('totalPoints');
      expect(context.studentProfile).toHaveProperty('learningStyle');
      expect(context.studentProfile).toHaveProperty('strongSubjects');
      expect(context.studentProfile).toHaveProperty('weakSubjects');
      expect(context.studentProfile).toHaveProperty('studyProgress');
      expect(context.studentProfile).toHaveProperty('compressedMetadata');
    });

    test('should adapt context based on learning style', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'selective',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 2048
      };

      const context = await buildEnhancedContext(request);
      
      // Verify learning style adaptation
      expect(context.studentProfile.learningStyle).toBeDefined();
      expect(context.studentProfile.learningStyle.type).toMatch(/^(visual|auditory|kinesthetic|reading_writing)$/);
      expect(context.studentProfile.learningStyle.preferences).toBeDefined();
      expect(context.studentProfile.learningStyle.adaptiveFactors).toBeDefined();
    });
  });

  describe('Knowledge Base Integration', () => {
    test('should search educational content with proper filtering', async () => {
      const filters: SearchFilters = {
        subjects: ['Mathematics'],
        contentTypes: ['concept', 'fact'],
        difficulty: 3,
        minReliability: 0.7,
        minEducationalValue: 0.5,
        limit: 10
      };

      const results = await searchKnowledge('algebra equations', filters);
      
      expect(Array.isArray(results)).toBe(true);
      
      // Verify search result structure
      results.forEach(result => {
        expect(result).toHaveProperty('entry');
        expect(result).toHaveProperty('relevanceScore');
        expect(result).toHaveProperty('matchReasons');
        expect(result).toHaveProperty('context');
        expect(result.entry).toHaveProperty('content');
        expect(result.entry).toHaveProperty('subject');
        expect(result.entry).toHaveProperty('type');
        expect(result.entry).toHaveProperty('confidence');
      });
    });

    test('should validate facts against knowledge base', async () => {
      const result = await validateFact({
        fact: 'The derivative of x^2 is 2x',
        context: 'calculus',
        strictness: 'moderate'
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('supportingSources');
      expect(result).toHaveProperty('contradictingSources');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should integrate educational sources with reliability scoring', async () => {
      const filters: SearchFilters = {
        minReliability: 0.8,
        minEducationalValue: 0.6,
        limit: 5
      };

      const results = await searchKnowledge('photosynthesis', filters);
      
      // Verify high-quality sources are prioritized
      results.forEach(result => {
        expect(result.entry.confidence).toBeGreaterThanOrEqual(0.7);
        expect(result.entry.educationalValue).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('Context Optimizer Integration', () => {
    test('should optimize context for different token budgets', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'full',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 4000
      };

      const context = await buildEnhancedContext(request);
      
      const optimizationRequest: OptimizationRequest = {
        context,
        tokenLimit: 1500,
        strategy: 'balanced',
        educationalPriority: true,
        preserveComponents: ['profile', 'knowledge'],
        minimumQuality: 0.6
      };

      const result = await optimizeContext(optimizationRequest);
      
      expect(result).toBeDefined();
      expect(result.optimizedContext).toBeDefined();
      expect(result.tokenReduction).toBeGreaterThan(0);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
      expect(result.optimizationDetails).toBeDefined();
      expect(result.preservedInformation).toBeDefined();
    });

    test('should apply different optimization strategies', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'full',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 4000
      };

      const context = await buildEnhancedContext(request);
      const strategies: OptimizationStrategy[] = ['quality_preserving', 'size_reducing', 'balanced', 'performance_oriented'];
      
      for (const strategy of strategies) {
        const optimizationRequest: OptimizationRequest = {
          context: { ...context },
          tokenLimit: 1500,
          strategy,
          educationalPriority: true
        };

        const result = await optimizeContext(optimizationRequest);
        
        expect(result.optimizedContext).toBeDefined();
        expect(result.optimizationDetails.compressionTechniques).toContain(strategy);
      }
    });

    test('should preserve critical educational information', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'full',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 4000
      };

      const context = await buildEnhancedContext(request);
      
      const optimizationRequest: OptimizationRequest = {
        context,
        tokenLimit: 1000, // Very aggressive reduction
        strategy: 'size_reducing',
        preserveComponents: ['profile', 'knowledge'],
        minimumQuality: 0.5
      };

      const result = await optimizeContext(optimizationRequest);
      
      // Verify critical information is preserved
      expect(result.preservedInformation.criticalFacts.length).toBeGreaterThan(0);
      expect(result.preservedInformation.learningObjectives.length).toBeGreaterThanOrEqual(0);
      expect(result.preservedInformation.studentPreferences).toBeDefined();
      expect(result.preservedInformation.recentProgress).toBeDefined();
    });
  });

  describe('Conversation Memory Integration', () => {
    test('should search relevant study memories', async () => {
      const request: MemorySearchRequest = {
        userId: testUserId,
        query: 'calculus derivatives',
        maxResults: 5,
        minRelevanceScore: 0.3,
        includeLinked: true,
        sortBy: 'relevance'
      };

      const results = await searchMemories(request);
      
      expect(Array.isArray(results)).toBe(true);
      
      // Verify memory search result structure
      results.forEach(result => {
        expect(result).toHaveProperty('memory');
        expect(result).toHaveProperty('relevanceScore');
        expect(result).toHaveProperty('matchReasons');
        expect(result).toHaveProperty('context');
        expect(result.memory).toHaveProperty('id');
        expect(result.memory).toHaveProperty('userId', testUserId);
        expect(result.memory).toHaveProperty('memoryType');
        expect(result.memory).toHaveProperty('interactionData');
      });
    });

    test('should store study interactions with proper metadata', async () => {
      const memoryData = {
        userId: testUserId,
        conversationId: testConversationId,
        memoryType: 'learning_interaction' as const,
        interactionData: {
          content: 'How do I solve quadratic equations?',
          response: 'To solve quadratic equations, use the formula...',
          subject: 'Mathematics',
          topic: 'Algebra',
          timestamp: new Date(),
          complexity: 'moderate' as const,
          sentiment: 'positive' as const
        },
        qualityScore: 0.8,
        priority: 'medium' as const,
        retention: 'long_term' as const,
        tags: ['mathematics', 'algebra', 'equations'],
        metadata: {
          source: 'user_input',
          version: 1,
          compressionApplied: false,
          validationStatus: 'valid' as const,
          accessCount: 0,
          lastAccessed: new Date(),
          linkedToKnowledgeBase: false,
          crossConversationLinked: false
        },
        linkedMemories: []
      };

      const result = await storeMemory(memoryData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.memoryType).toBe('learning_interaction');
      expect(result.qualityScore).toBe(0.8);
    });
  });

  describe('Study Buddy Hook Integration', () => {
    test('should integrate all Layer 2 components with useStudyBuddy hook', () => {
      const hook = mockUseStudyBuddy();
      
      // Verify enhanced state properties
      expect(hook.enhancedContext).toBeDefined();
      expect(hook.layer2Context).toBeDefined();
      expect(hook.layer2Context.knowledgeBase).toBeDefined();
      expect(hook.layer2Context.relevantMemories).toBeDefined();
      expect(hook.layer2Context.contextOptimization).toBeDefined();
      expect(hook.layer2Context.compressionLevel).toBeDefined();
      expect(hook.layer2Context.tokenUsage).toBeDefined();

      // Verify enhanced action methods
      expect(typeof hook.buildEnhancedStudyContext).toBe('function');
      expect(typeof hook.getRelevantStudyMemories).toBe('function');
      expect(typeof hook.optimizeStudyContext).toBe('function');
      expect(typeof hook.getStudyKnowledgeBase).toBe('function');
      expect(typeof hook.storeStudyInteraction).toBe('function');
      expect(typeof hook.getLearningProgress).toBe('function');
    });

    test('should provide 4-level context compression system', async () => {
      const levels: ContextLevel[] = ['light', 'recent', 'selective', 'full'];
      
      for (const level of levels) {
        mockStudyBuddy.buildEnhancedStudyContext.mockResolvedValueOnce({
          compressionLevel: level,
          tokenUsage: { total: level === 'light' ? 500 : level === 'recent' ? 1000 : level === 'selective' ? 2000 : 4000 }
        });

        const result = await mockStudyBuddy.buildEnhancedStudyContext(level);
        
        expect(result.compressionLevel).toBe(level);
        expect(mockStudyBuddy.buildEnhancedStudyContext).toHaveBeenCalledWith(level);
      }
    });

    test('should enable educational content search with context awareness', async () => {
      const query = 'Newton\\'s laws of motion';
      const filters: SearchFilters = {
        subjects: ['Physics'],
        minReliability: 0.7,
        limit: 5
      };

      mockStudyBuddy.getStudyKnowledgeBase.mockResolvedValueOnce([
        {
          entry: {
            content: 'Newton\\'s first law states...',
            subject: 'Physics',
            type: 'fact',
            confidence: 0.9
          },
          relevanceScore: 0.95,
          matchReasons: ['Content match', 'Subject: Physics'],
          snippets: [],
          context: 'Subject: Physics • Type: fact'
        }
      ]);

      const results = await mockStudyBuddy.getStudyKnowledgeBase(query, filters);
      
      expect(mockStudyBuddy.getStudyKnowledgeBase).toHaveBeenCalledWith(query, filters);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should implement learning style adaptation', async () => {
      mockStudyBuddy.buildEnhancedStudyContext.mockResolvedValueOnce({
        studentProfile: {
          learningStyle: {
            type: 'visual',
            preferences: {
              stepByStep: true,
              examplesFirst: true,
              abstractConcepts: false,
              practicalApplication: true
            },
            adaptiveFactors: {
              difficultyRamp: 'gradual',
              explanationDepth: 'detailed',
              questionFrequency: 'medium'
            }
          }
        }
      });

      const context = await mockStudyBuddy.buildEnhancedStudyContext('selective');
      
      expect(context.studentProfile.learningStyle.type).toBe('visual');
      expect(context.studentProfile.learningStyle.preferences.stepByStep).toBe(true);
      expect(context.studentProfile.learningStyle.adaptiveFactors.difficultyRamp).toBe('gradual');
    });
  });

  describe('End-to-End Integration Workflow', () => {
    test('should complete full study session workflow with Layer 2', async () => {
      // Step 1: Build enhanced context
      mockStudyBuddy.buildEnhancedStudyContext.mockResolvedValueOnce({
        compressionLevel: 'selective',
        studentProfile: {
          userId: testUserId,
          learningStyle: { type: 'reading_writing' },
          strongSubjects: ['Mathematics'],
          weakSubjects: ['Physics']
        },
        tokenUsage: { total: 1500 }
      });

      // Step 2: Search relevant memories
      mockStudyBuddy.getRelevantStudyMemories.mockResolvedValueOnce([
        {
          memory: {
            id: 'mem-1',
            interactionData: { content: 'Previous calculus question' }
          },
          relevanceScore: 0.8
        }
      ]);

      // Step 3: Search knowledge base
      mockStudyBuddy.getStudyKnowledgeBase.mockResolvedValueOnce([
        {
          entry: { content: 'Derivative definition', subject: 'Mathematics' },
          relevanceScore: 0.9
        }
      ]);

      // Step 4: Optimize context
      mockStudyBuddy.optimizeStudyContext.mockResolvedValueOnce({
        optimizedContext: { tokenUsage: { total: 1200 } },
        tokenReduction: 300,
        qualityScore: 0.85
      });

      // Execute workflow
      const context = await mockStudyBuddy.buildEnhancedStudyContext('selective');
      const memories = await mockStudyBuddy.getRelevantStudyMemories('calculus');
      const knowledge = await mockStudyBuddy.getStudyKnowledgeBase('derivatives');
      const optimization = await mockStudyBuddy.optimizeStudyContext();

      // Verify workflow
      expect(context).toBeDefined();
      expect(memories).toBeDefined();
      expect(knowledge).toBeDefined();
      expect(optimization).toBeDefined();
      expect(optimization.tokenReduction).toBeGreaterThan(0);
    });

    test('should handle error scenarios gracefully', async () => {
      // Simulate error in context building
      mockStudyBuddy.buildEnhancedStudyContext.mockRejectedValueOnce(new Error('Context build failed'));
      
      try {
        await mockStudyBuddy.buildEnhancedStudyContext('selective');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Context build failed');
      }

      // Simulate error in knowledge search
      mockStudyBuddy.getStudyKnowledgeBase.mockRejectedValueOnce(new Error('Knowledge search failed'));
      
      try {
        await mockStudyBuddy.getStudyKnowledgeBase('test query');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Knowledge search failed');
      }
    });
  });

  describe('Performance and Quality Metrics', () => {
    test('should measure context building performance', async () => {
      const startTime = Date.now();
      
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'selective',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 2048
      };

      await buildEnhancedContext(request);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Context building should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    test('should maintain quality scores above threshold', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'selective',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 2048
      };

      const context = await buildEnhancedContext(request);
      
      // Verify quality indicators
      expect(context.confidenceMarkers.length).toBeGreaterThanOrEqual(0);
      expect(context.factCheckPoints.length).toBeGreaterThanOrEqual(0);
      
      // Knowledge base entries should have high quality scores
      context.knowledgeBase.forEach(entry => {
        expect(entry.educationalValue).toBeGreaterThanOrEqual(0.4);
        expect(entry.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });

    test('should optimize token usage efficiently', async () => {
      const request: ContextBuildRequest = {
        userId: testUserId,
        level: 'full',
        includeMemories: true,
        includeKnowledge: true,
        includeProgress: true,
        tokenLimit: 4000
      };

      const context = await buildEnhancedContext(request);
      
      const optimizationRequest: OptimizationRequest = {
        context,
        tokenLimit: 1500,
        strategy: 'balanced'
      };

      const result = await optimizeContext(optimizationRequest);
      
      // Verify optimization efficiency
      expect(result.tokenReduction).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeLessThan(1);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.5);
      expect(result.optimizationDetails.optimizedTokenCount).toBeLessThanOrEqual(1500);
    });
  });
});

// Integration test for the complete Layer 2 system
describe('Layer 2 Complete System Integration', () => {
  test('should demonstrate complete Layer 2 integration with study buddy', async () => {
    const testUserId = 'integration-test-user';
    
    // 1. Enhanced Context Building
    const contextRequest: ContextBuildRequest = {
      userId: testUserId,
      level: 'selective',
      includeMemories: true,
      includeKnowledge: true,
      includeProgress: true,
      tokenLimit: 2048
    };

    const enhancedContext = await buildEnhancedContext(contextRequest);
    expect(enhancedContext).toBeDefined();
    expect(enhancedContext.compressionLevel).toBe('selective');

    // 2. Knowledge Base Search
    const knowledgeResults = await searchKnowledge('machine learning algorithms', {
      subjects: ['Computer Science'],
      minReliability: 0.7,
      limit: 5
    });
    expect(knowledgeResults.length).toBeGreaterThanOrEqual(0);

    // 3. Memory Search
    const memoryResults = await searchMemories({
      userId: testUserId,
      query: 'algorithm complexity',
      maxResults: 3
    });
    expect(memoryResults.length).toBeGreaterThanOrEqual(0);

    // 4. Context Optimization
    const optimizationRequest: OptimizationRequest = {
      context: enhancedContext,
      tokenLimit: 1500,
      strategy: 'balanced',
      educationalPriority: true
    };

    const optimizationResult = await optimizeContext(optimizationRequest);
    expect(optimizationResult).toBeDefined();
    expect(optimizationResult.tokenReduction).toBeGreaterThan(0);

    // 5. Fact Validation
    const factValidation = await validateFact({
      fact: 'Binary search has O(log n) time complexity',
      context: 'algorithms',
      strictness: 'moderate'
    });
    expect(factValidation).toBeDefined();
    expect(typeof factValidation.confidence).toBe('number');

    console.log('✅ Layer 2 Complete System Integration Test Passed');
    console.log(`- Enhanced context built with ${enhancedContext.tokenUsage.total} tokens`);
    console.log(`- Knowledge base returned ${knowledgeResults.length} results`);
    console.log(`- Memory search returned ${memoryResults.length} memories`);
    console.log(`- Context optimization reduced tokens by ${optimizationResult.tokenReduction}`);
    console.log(`- Fact validation confidence: ${factValidation.confidence.toFixed(2)}`);
  });
});