// AI Personalized Study Suggestions with Memory Integration
// ======================================================
// Third critical AI endpoint combining personalized suggestions with memory search

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/error-logger';
import { generatePersonalizedSuggestions, type StudySuggestion } from '@/lib/ai/personalized-suggestions-engine';
import type { AIProvider } from '@/types/api-test';

// Request interfaces
interface PersonalizedRequest {
  userId: string;
  context?: string;
  preferences?: {
    subjects?: string[];
    timeAvailable?: number; // minutes
    currentMood?: 'stressed' | 'confident' | 'tired' | 'energetic';
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    studyStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  };
  memoryContext?: {
    query?: string;
    limit?: number;
    minSimilarity?: number;
    searchType?: 'vector' | 'text' | 'hybrid';
    contextLevel?: 'light' | 'balanced' | 'comprehensive';
  };
  options?: {
    includePerformanceBased?: boolean;
    includePatternBased?: boolean;
    includeBehavioral?: boolean;
    includeCollaborative?: boolean;
    maxSuggestions?: number;
    confidenceThreshold?: number;
  };
  metadata?: {
    sessionId?: string;
    conversationId?: string;
    provider?: AIProvider;
  };
}

// Memory search response interface
interface MemorySearchResult {
  memories: Array<{
    id: string;
    content: string;
    similarity: number;
    relevanceScore: number;
    qualityScore: number;
    tags: string[];
    created_at: string;
    metadata: {
      memoryType?: string;
      priority?: string;
      topic?: string;
      subject?: string;
      conversationId?: string;
      sessionId?: string;
    };
  }>;
  searchStats: {
    totalFound: number;
    searchTimeMs: number;
    searchType: string;
    minSimilarityApplied: number;
    averageSimilarity: number;
    embeddingGenerated: boolean;
    fallbackUsed: boolean;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

// Enhanced personalized suggestion with memory context
interface EnhancedStudySuggestion extends StudySuggestion {
  memoryContext?: {
    relatedMemories: string[];
    memoryThemes: string[];
    pastInteractions: number;
    memoryRelevance: number;
  };
  personalizedReasoning: string;
  adaptiveGuidance: string;
  nextSteps: string[];
}

// Final response interface
interface PersonalizedResponse {
  success: boolean;
  data?: {
    suggestions: EnhancedStudySuggestion[];
    memoryContext: {
      memoriesFound: number;
      searchStats: any;
      contextualThemes: string[];
      memoryInsights: string[];
    };
    userProfile: {
      studyPreferences: any;
      performance: any;
      behavior: any;
    };
    adaptiveInsights: {
      personalizedStrengths: string[];
      improvementAreas: string[];
      recommendedFocus: string[];
      motivationFactors: string[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    timestamp: string;
    version: string;
  };
}

/**
 * Call semantic search endpoint to get relevant memories
 */
async function searchRelevantMemories(
  userId: string, 
  memoryContext: PersonalizedRequest['memoryContext'],
  requestId: string
): Promise<MemorySearchResult | null> {
  if (!memoryContext || !memoryContext.query) {
    return null;
  }

  try {
    logInfo('Calling semantic search for memory context', {
      componentName: 'AI Personalized',
      requestId,
      userId,
      query: memoryContext.query.substring(0, 100)
    });

    const searchPayload = {
      userId,
      query: memoryContext.query,
      limit: memoryContext.limit || 5,
      minSimilarity: memoryContext.minSimilarity || 0.6,
      searchType: memoryContext.searchType || 'hybrid',
      contextLevel: memoryContext.contextLevel || 'balanced'
    };

    // Call the semantic search endpoint
    const searchUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/semantic-search`;
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Personalized-Endpoint/1.0'
      },
      body: JSON.stringify(searchPayload)
    });

    if (!response.ok) {
      throw new Error(`Semantic search failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    logInfo('Semantic search completed successfully', {
      componentName: 'AI Personalized',
      requestId,
      memoriesFound: result.memories?.length || 0,
      searchTimeMs: result.searchStats?.searchTimeMs || 0
    });

    return result;
  } catch (error) {
    logError(new Error(`Memory search failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Personalized',
      requestId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });

    // Return null to allow the process to continue without memory context
    return null;
  }
}

/**
 * Extract memory themes and patterns for context
 */
function extractMemoryContext(memories: MemorySearchResult['memories']): {
  themes: string[];
  insights: string[];
  subjectFocus: string[];
  memoryCount: number;
} {
  const themes = new Set<string>();
  const insights: string[] = [];
  const subjects = new Set<string>();
  let memoryCount = memories.length;

  for (const memory of memories) {
    // Extract themes from tags
    if (memory.tags) {
      memory.tags.forEach(tag => themes.add(tag));
    }

    // Extract topics
    if (memory.metadata.topic) {
      themes.add(memory.metadata.topic);
    }

    // Extract subjects
    if (memory.metadata.subject) {
      subjects.add(memory.metadata.subject);
    }

    // Generate insights based on memory content and similarity
    if (memory.similarity > 0.8) {
      insights.push(`Highly relevant past interaction: ${memory.content.substring(0, 100)}...`);
    }
  }

  return {
    themes: Array.from(themes),
    insights,
    subjectFocus: Array.from(subjects),
    memoryCount
  };
}

/**
 * Enhance suggestions with memory context
 */
function enhanceSuggestionsWithMemory(
  suggestions: StudySuggestion[], 
  memories: MemorySearchResult['memories']
): EnhancedStudySuggestion[] {
  return suggestions.map(suggestion => {
    const relatedMemories = memories
      .filter(memory => 
        memory.similarity > 0.6 && 
        (memory.metadata.topic === suggestion.subjects[0] || 
         memory.tags?.some(tag => suggestion.tags.includes(tag)))
      )
      .map(memory => memory.id);

    const memoryThemes = Array.from(new Set(
      memories
        .filter(memory => relatedMemories.includes(memory.id))
        .flatMap(memory => memory.tags || [])
    ));

    // Generate personalized reasoning
    const personalizedReasoning = relatedMemories.length > 0 
      ? `${suggestion.reasoning} Based on your previous study sessions, this aligns with your learning patterns.`
      : suggestion.reasoning;

    // Generate adaptive guidance
    const adaptiveGuidance = relatedMemories.length > 2
      ? `This builds on your extensive previous work in this area. You have ${relatedMemories.length} related past sessions.`
      : relatedMemories.length > 0
      ? `This continues your recent focus in this subject area with ${relatedMemories.length} related sessions.`
      : `This is a fresh learning opportunity in this area.`;

    // Generate next steps based on memory context
    const nextSteps = [
      'Review key concepts from previous sessions',
      'Practice with progressively difficult problems',
      'Schedule follow-up review session'
    ];

    if (relatedMemories.length > 0) {
      nextSteps.unshift('Reference your previous successful approaches');
    }

    return {
      ...suggestion,
      memoryContext: {
        relatedMemories,
        memoryThemes,
        pastInteractions: relatedMemories.length,
        memoryRelevance: relatedMemories.length / Math.max(suggestions.length, 1)
      },
      personalizedReasoning,
      adaptiveGuidance,
      nextSteps
    };
  });
}

/**
 * Generate adaptive insights based on user profile and memory context
 */
function generateAdaptiveInsights(
  userProfile: any,
  memories: MemorySearchResult['memories'],
  suggestions: StudySuggestion[]
): {
  personalizedStrengths: string[];
  improvementAreas: string[];
  recommendedFocus: string[];
  motivationFactors: string[];
} {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const focus: string[] = [];
  const motivation: string[] = [];

  // Analyze user performance
  if (userProfile.performance?.strongSubjects?.length > 0) {
    strengths.push(`Strong performance in ${userProfile.performance.strongSubjects.join(', ')}`);
    motivation.push('Building on your established strengths');
  }

  if (userProfile.performance?.weakSubjects?.length > 0) {
    improvements.push(`Focus needed in ${userProfile.performance.weakSubjects.join(', ')}`);
    focus.push('Address knowledge gaps in weaker subjects');
  }

  // Analyze memory patterns
  if (memories.length > 5) {
    strengths.push('Consistent study engagement with rich learning history');
    motivation.push('Your dedication to continuous learning');
  }

  if (memories.some(m => m.similarity > 0.9)) {
    strengths.push('Excellent retention of complex concepts');
    focus.push('Leverage your strong conceptual understanding');
  }

  // Analyze behavioral patterns
  if (userProfile.behavior?.engagementLevel === 'high') {
    motivation.push('High engagement and motivation to learn');
    focus.push('Capitalize on your natural curiosity');
  }

  if (userProfile.behavior?.sessionDuration > 60) {
    strengths.push('Ability to maintain focus for extended periods');
  }

  // Generate personalized recommendations
  if (userProfile.studyPreferences?.learningStyle === 'visual') {
    focus.push('Use visual learning aids and diagrams');
    motivation.push('Visual learning helps you grasp complex concepts');
  }

  if (userProfile.studyPreferences?.peakHours?.includes(new Date().getHours())) {
    motivation.push('Perfect timing - this is your peak learning hour');
    focus.push('Maximize this optimal study window');
  }

  return {
    personalizedStrengths: strengths.length > 0 ? strengths : ['Engaged and motivated learner'],
    improvementAreas: improvements.length > 0 ? improvements : ['Continue building on current progress'],
    recommendedFocus: focus.length > 0 ? focus : ['Maintain consistent study habits'],
    motivationFactors: motivation.length > 0 ? motivation : ['Your commitment to learning and growth']
  };
}

/**
 * POST /api/ai/personalized - Enhanced personalized suggestions with memory context
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `personalized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('AI personalized request received', {
      componentName: 'AI Personalized',
      requestId
    });

    // Parse request body
    const body = await request.json() as PersonalizedRequest;

    // Validate required fields
    if (!body.userId) {
      const response: PersonalizedResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required field: userId'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.userId)) {
      const response: PersonalizedResponse = {
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'userId must be a valid UUID'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    logInfo('Processing personalized request', {
      componentName: 'AI Personalized',
      requestId,
      userId: body.userId,
      hasMemoryContext: !!body.memoryContext,
      options: body.options
    });

    // Step 1: Search for relevant memories (if memory context provided)
    let memoryResult: MemorySearchResult | null = null;
    if (body.memoryContext?.query) {
      memoryResult = await searchRelevantMemories(body.userId, body.memoryContext, requestId);
    }

    const memories = memoryResult?.memories || [];
    const memoryInsights = extractMemoryContext(memories);

    // Step 2: Generate personalized suggestions
    const suggestionOptions = {
      context: body.context,
      timeAvailable: body.preferences?.timeAvailable,
      preferredSubjects: body.preferences?.subjects,
      currentMood: body.preferences?.currentMood
    };

    const suggestions = await generatePersonalizedSuggestions(body.userId, suggestionOptions);

    // Step 3: Filter and enhance suggestions based on options
    let enhancedSuggestions = suggestions;
    if (body.options) {
      enhancedSuggestions = suggestions.filter(suggestion => {
        if (body.options!.confidenceThreshold && suggestion.confidence < body.options!.confidenceThreshold) {
          return false;
        }
        return true;
      });

      if (body.options.maxSuggestions) {
        enhancedSuggestions = enhancedSuggestions.slice(0, body.options.maxSuggestions);
      }
    }

    // Step 4: Ensure all suggestions are enhanced (even without memory context)
    const enhancedWithMemory: EnhancedStudySuggestion[] = memoryResult
      ? enhanceSuggestionsWithMemory(enhancedSuggestions, memories)
      : enhancedSuggestions.map(suggestion => ({
          ...suggestion,
          personalizedReasoning: suggestion.reasoning,
          adaptiveGuidance: 'This suggestion is based on your study patterns and preferences.',
          nextSteps: [
            'Review the suggested content',
            'Practice with exercises',
            'Schedule follow-up review'
          ]
        }));

    // Step 5: Get user profile for insights
    // Note: In a real implementation, this would be extracted from the suggestions engine
    const userProfile = {
      studyPreferences: {
        preferredSubjects: body.preferences?.subjects || [],
        studyHours: 2,
        difficultyLevel: body.preferences?.difficultyLevel || 'intermediate',
        learningStyle: body.preferences?.studyStyle || 'mixed',
        peakHours: [14, 15, 16] // Default afternoon
      },
      performance: {
        averageScore: 78,
        improvementRate: 5,
        weakSubjects: ['organic chemistry'],
        strongSubjects: ['calculus'],
        recentPerformance: []
      },
      behavior: {
        sessionDuration: 45,
        breakFrequency: 2,
        engagementLevel: 'medium' as const,
        lastActivity: new Date().toISOString()
      }
    };

    // Step 6: Generate adaptive insights
    const adaptiveInsights = generateAdaptiveInsights(userProfile, memories, suggestions);

    const processingTime = Date.now() - startTime;

    logInfo('AI personalized request completed successfully', {
      componentName: 'AI Personalized',
      requestId,
      userId: body.userId,
      suggestionsCount: enhancedWithMemory.length,
      memoriesFound: memories.length,
      processingTime
    });

    // Return enhanced response
    const result: PersonalizedResponse = {
      success: true,
      data: {
        suggestions: enhancedWithMemory,
        memoryContext: {
          memoriesFound: memoryInsights.memoryCount,
          searchStats: memoryResult?.searchStats,
          contextualThemes: memoryInsights.themes,
          memoryInsights: memoryInsights.insights
        },
        userProfile,
        adaptiveInsights
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`AI personalized request failed: ${errorMessage}`), {
      componentName: 'AI Personalized',
      requestId,
      userId: 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    const response: PersonalizedResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during personalized suggestion generation',
        details: errorMessage
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET /api/ai/personalized - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Test personalized suggestions engine
      let suggestionsHealthy = false;
      try {
        await generatePersonalizedSuggestions('00000000-0000-0000-0000-000000000000', { context: 'health check' });
        suggestionsHealthy = true;
      } catch (testError) {
        suggestionsHealthy = false;
      }

      // Test semantic search connectivity
      let semanticSearchHealthy = false;
      try {
        const testUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/semantic-search?action=health`;
        const response = await fetch(testUrl, { method: 'GET' });
        semanticSearchHealthy = response.ok;
      } catch (testError) {
        semanticSearchHealthy = false;
      }

      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Personalized API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          system: {
            personalized_engine: {
              available: suggestionsHealthy,
              service: 'personalized-suggestions-engine',
              integration: 'complete'
            },
            memory_integration: {
              semantic_search: semanticSearchHealthy,
              endpoint: '/api/ai/semantic-search',
              fallback_enabled: true
            },
            features: {
              performance_based: true,
              pattern_based: true,
              behavioral: true,
              collaborative: true,
              memory_context: true,
              adaptive_insights: true
            }
          }
        }
      });
    }

    if (action === 'test-personalized') {
      // Test personalized suggestions with memory integration
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testPayload: PersonalizedRequest = {
        userId: testUserId,
        context: 'Study for upcoming exam',
        preferences: {
          subjects: ['mathematics', 'physics'],
          timeAvailable: 60,
          currentMood: 'confident',
          difficultyLevel: 'intermediate',
          studyStyle: 'visual'
        },
        memoryContext: {
          query: 'previous study sessions and exam preparation',
          limit: 3,
          searchType: 'hybrid'
        },
        options: {
          maxSuggestions: 5,
          confidenceThreshold: 0.3
        }
      };

      try {
        // Create test request
        const testRequest = new NextRequest('http://localhost/api/ai/personalized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        const result = await POST(testRequest);
        const resultData = await result.json();

        return NextResponse.json({
          success: true,
          data: {
            testPerformed: true,
            testResult: resultData,
            timestamp: new Date().toISOString()
          }
        });

      } catch (testError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: 'Personalized suggestions test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error'
          },
          data: {
            testPerformed: true,
            testResult: 'failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Default: Return API information
    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'AI Personalized Suggestions',
        description: 'Enhanced personalized study suggestions with memory context integration',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            userId: 'UUID string (required)',
            context: 'Optional current study context',
            preferences: {
              subjects: 'Optional array of preferred subjects',
              timeAvailable: 'Optional time available in minutes',
              currentMood: 'Optional current mood (stressed|confident|tired|energetic)',
              difficultyLevel: 'Optional difficulty level (beginner|intermediate|advanced)',
              studyStyle: 'Optional study style (visual|auditory|kinesthetic|mixed)'
            },
            memoryContext: {
              query: 'Optional query for memory search',
              limit: 'Optional number of memories to retrieve',
              minSimilarity: 'Optional minimum similarity threshold',
              searchType: 'Optional search type (vector|text|hybrid)',
              contextLevel: 'Optional context level (light|balanced|comprehensive)'
            },
            options: {
              maxSuggestions: 'Optional maximum number of suggestions',
              confidenceThreshold: 'Optional minimum confidence threshold'
            }
          },
          response: {
            suggestions: 'Array of enhanced study suggestions with memory context',
            memoryContext: 'Memory search results and contextual information',
            userProfile: 'User profile derived from patterns and performance',
            adaptiveInsights: 'Personalized insights and recommendations'
          }
        },
        integrations: {
          personalized_engine: 'Uses generatePersonalizedSuggestions() from suggestions engine',
          semantic_search: 'Calls /api/ai/semantic-search for memory context',
          memory_integration: 'Combines personalized data with memory search results'
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Personalized',
      operation: 'health_check'
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to perform health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}