// AI Semantic Search Endpoint
// ==========================
// Direct memory retrieval to fix Study Buddy memory issues

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '@/lib/error-logger-server-safe';
import { MemoryQueries } from '@/lib/database/queries';
import { semanticSearch, generateQueryEmbedding } from '@/lib/ai/semantic-search';
import type { AIProvider } from '@/types/api-test';

// Server-side Supabase client for direct database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request/Response interfaces
interface SemanticSearchRequest {
  userId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
  tags?: string[];
  importanceScore?: number;
  contextLevel?: 'light' | 'balanced' | 'comprehensive';
  preferredProvider?: AIProvider;
  searchType?: 'vector' | 'text' | 'hybrid';
}

interface SemanticSearchResult {
  memories: Array<{
    id: string;
    content: string;
    similarity: number;
    relevanceScore: number;
    qualityScore: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    interaction_data: any;
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
    tagsFilter?: string[];
    contextLevel?: string;
    embeddingGenerated: boolean;
    fallbackUsed: boolean;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

/**
 * Extract content from memory for text-based search
 */
function extractMemoryContent(memory: any): string {
  // Try multiple fields to get the actual content
  if (memory.interaction_data?.content) {
    return memory.interaction_data.content;
  }
  if (memory.interaction_data?.message) {
    return memory.interaction_data.message;
  }
  if (memory.content) {
    return memory.content;
  }
  if (memory.message) {
    return memory.message;
  }
  if (memory.response) {
    return memory.response;
  }
  return '';
}

/**
 * Calculate text similarity score for fallback search
 */
function calculateTextSimilarity(query: string, content: string): number {
  if (!query || !content) return 0;
  
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Exact match gets highest score
  if (contentLower.includes(queryLower)) {
    return 0.9;
  }
  
  // Check for word overlap
  const queryWords = queryLower.split(/\s+/);
  const contentWords = contentLower.split(/\s+/);
  const matches = queryWords.filter(word => contentWords.some(cword => cword.includes(word)));
  
  if (matches.length === 0) return 0;
  
  // Calculate similarity based on word matches and position
  const matchRatio = matches.length / queryWords.length;
  const positionBonus = queryWords[0] && contentLower.indexOf(queryWords[0]) !== -1 ? 0.1 : 0;
  
  return Math.min(0.8, matchRatio * 0.7 + positionBonus);
}

/**
 * Text-based fallback search when vector search fails
 */
async function performTextSearch(userId: string, query: string, options: any): Promise<any[]> {
  logInfo('Performing text-based fallback search', {
    componentName: 'AI Semantic Search',
    userId,
    query: query.substring(0, 100),
    limit: options.limit,
    minSimilarity: options.min_similarity
  });

  try {
    // Get memories with text content for the user
    const { data: memories, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('user_id', userId)
      .order('memory_relevance_score', { ascending: false })
      .limit((options.limit || 5) * 3); // Get more to filter

    if (error) {
      throw new Error(`Text search failed: ${error.message}`);
    }

    // Calculate text similarity scores
    const scoredMemories = (memories || []).map(memory => {
      const content = extractMemoryContent(memory);
      const similarity = calculateTextSimilarity(query, content);
      
      return {
        ...memory,
        similarity,
        searchType: 'text'
      };
    });

    // Filter by minimum similarity
    let filtered = scoredMemories.filter(memory => 
      memory.similarity >= (options.min_similarity || 0.1)
    );

    // Apply tag filter if specified
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(memory => {
        const memoryTags = memory.interaction_data?.tags || memory.tags || [];
        return options.tags.some((tag: string) => memoryTags.includes(tag));
      });
    }

    // Apply importance score filter if specified
    if (options.importance_score) {
      filtered = filtered.filter(memory => 
        (memory.importance_score || 0.5) >= options.importance_score
      );
    }

    // Sort by similarity score and limit results
    const sortedResults = filtered
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit || 5);

    logInfo('Text-based search completed', {
      componentName: 'AI Semantic Search',
      totalRetrieved: memories?.length || 0,
      totalFiltered: filtered.length,
      finalResults: sortedResults.length
    });

    return sortedResults;

  } catch (error) {
    logError(new Error(`Text search failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Semantic Search',
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * POST /api/ai/semantic-search - Search memories using semantic search
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `semantic-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('AI semantic search request received', {
      componentName: 'AI Semantic Search',
      requestId
    });

    // Parse request body
    const body = await request.json() as SemanticSearchRequest;

    // Validate required fields
    if (!body.userId || !body.query) {
      const response: ErrorResponse = {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: userId, query'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate userId format - allow both real UUIDs and test IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const testUserRegex = /^[0-9a-z-]+$/i; // Allow alphanumeric and dashes for test users
    if (!uuidRegex.test(body.userId) && !testUserRegex.test(body.userId)) {
      const response: ErrorResponse = {
        error: {
          code: 'INVALID_USER_ID',
          message: 'userId must be a valid UUID or test user ID'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Set default options
    const searchOptions = {
      limit: Math.min(body.limit || 5, 20), // Cap at 20
      min_similarity: Math.max(0.1, Math.min(body.minSimilarity || 0.7, 1.0)),
      tags: body.tags || [],
      importance_score: body.importanceScore
    };

    const searchType = body.searchType || 'hybrid';
    let memories: any[] = [];
    let embeddingGenerated = false;
    let fallbackUsed = false;

    logInfo('Starting memory search', {
      componentName: 'AI Semantic Search',
      requestId,
      userId: body.userId,
      query: body.query.substring(0, 100),
      searchType,
      ...searchOptions
    });

    try {
      if (searchType === 'vector' || searchType === 'hybrid') {
        try {
          // Try vector-based semantic search
          const { embedding } = await generateQueryEmbedding(body.query, body.preferredProvider);
          embeddingGenerated = true;

          memories = await MemoryQueries.findSimilarMemories(
            body.userId, 
            embedding, 
            searchOptions
          );

          logInfo('Vector search successful', {
            componentName: 'AI Semantic Search',
            requestId,
            resultsFound: memories.length
          });

        } catch (vectorError) {
          if (searchType === 'vector') {
            throw vectorError; // Re-throw if vector-only search failed
          }

          logInfo('Vector search failed, falling back to text search', {
            componentName: 'AI Semantic Search',
            requestId,
            error: vectorError instanceof Error ? vectorError.message : String(vectorError)
          });

          fallbackUsed = true;
          memories = await performTextSearch(body.userId, body.query, searchOptions);
        }
      } else {
        // Text-only search
        memories = await performTextSearch(body.userId, body.query, searchOptions);
      }

    } catch (searchError) {
      logError(new Error(`Search failed: ${searchError instanceof Error ? searchError.message : String(searchError)}`), {
        componentName: 'AI Semantic Search',
        requestId,
        userId: body.userId,
        searchType,
        error: searchError instanceof Error ? searchError.message : String(searchError)
      });

      const response: ErrorResponse = {
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search memories',
          details: searchError instanceof Error ? searchError.message : String(searchError)
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Process and format results
    const processedMemories = memories.map(memory => {
      const content = extractMemoryContent(memory);
      const interactionData = memory.interaction_data || {};
      
      return {
        id: memory.id,
        content,
        similarity: memory.similarity || memory.memory_relevance_score || 0.5,
        relevanceScore: memory.memory_relevance_score || 0.5,
        qualityScore: memory.quality_score || 0.5,
        tags: interactionData.tags || memory.tags || [],
        created_at: memory.created_at,
        updated_at: memory.updated_at,
        interaction_data: memory.interaction_data,
        metadata: {
          memoryType: interactionData.memoryType,
          priority: interactionData.priority,
          topic: interactionData.topic,
          subject: interactionData.subject,
          conversationId: memory.conversation_id,
          sessionId: interactionData.sessionId
        }
      };
    });

    // Apply context level filtering if specified
    let filteredMemories = processedMemories;
    if (body.contextLevel) {
      const contextLevel = body.contextLevel;
      switch (contextLevel) {
        case 'light':
          filteredMemories = processedMemories.slice(0, 2);
          break;
        case 'balanced':
          // Take top 3-4 with diversity
          const topResults = processedMemories.slice(0, 4);
          const uniqueTopics = new Set<string>();
          const diverseResults: any[] = [];
          
          for (const memory of topResults) {
            const topicKey = memory.metadata.topic || 'general';
            if (!uniqueTopics.has(topicKey) || diverseResults.length < 2) {
              uniqueTopics.add(topicKey);
              diverseResults.push(memory);
            }
          }
          filteredMemories = diverseResults.length > 0 ? diverseResults : topResults;
          break;
        case 'comprehensive':
          // Return all (already limited by searchOptions.limit)
          filteredMemories = processedMemories;
          break;
        default:
          filteredMemories = processedMemories.slice(0, 3);
      }
    }

    // Calculate search statistics
    const searchTimeMs = Date.now() - startTime;
    const similarities = filteredMemories.map(m => m.similarity);
    const averageSimilarity = similarities.length > 0 
      ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length 
      : 0;

    const result: SemanticSearchResult = {
      memories: filteredMemories,
      searchStats: {
        totalFound: filteredMemories.length,
        searchTimeMs,
        searchType,
        minSimilarityApplied: searchOptions.min_similarity,
        averageSimilarity,
        tagsFilter: body.tags || undefined,
        contextLevel: body.contextLevel,
        embeddingGenerated,
        fallbackUsed
      },
      metadata: {
        requestId,
        processingTime: searchTimeMs,
        timestamp: new Date().toISOString()
      }
    };

    logInfo('AI semantic search completed successfully', {
      componentName: 'AI Semantic Search',
      requestId,
      userId: body.userId,
      resultsFound: filteredMemories.length,
      searchTimeMs,
      searchType,
      embeddingGenerated,
      fallbackUsed
    });

    return NextResponse.json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`AI semantic search failed: ${errorMessage}`), {
      componentName: 'AI Semantic Search',
      requestId,
      userId: 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    const response: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during semantic search',
        details: errorMessage
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET /api/ai/semantic-search - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Test database connectivity
      const { error: dbError } = await supabase
        .from('conversation_memory')
        .select('id')
        .limit(1);

      const dbHealthy = !dbError;

      // Test semantic search service
      let semanticHealthy = false;
      try {
        await generateQueryEmbedding('test query');
        semanticHealthy = true;
      } catch (testError) {
        semanticHealthy = false;
      }

      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Semantic Search API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          system: {
            database: {
              connected: dbHealthy,
              table: 'conversation_memory',
              error: dbError?.message
            },
            semantic_search: {
              available: semanticHealthy,
              embedding_service: 'unified-embedding-service',
              fallback_enabled: true
            },
            search_modes: {
              vector: true,
              text: true,
              hybrid: true
            }
          }
        }
      });
    }

    if (action === 'test-search') {
      // Test semantic search with sample data
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testQuery = 'test semantic search functionality';

      try {
        const testPayload: SemanticSearchRequest = {
          userId: testUserId,
          query: testQuery,
          limit: 3,
          minSimilarity: 0.5,
          searchType: 'hybrid'
        };

        // Create test request
        const testRequest = new NextRequest('http://localhost/api/ai/semantic-search', {
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
            message: 'Semantic search test failed',
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
        endpoint: 'AI Semantic Search',
        description: 'Direct memory retrieval to fix Study Buddy memory issues',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            userId: 'UUID string (required)',
            query: 'Search query (required)',
            limit: 'Optional: number of results (default: 5, max: 20)',
            minSimilarity: 'Optional: minimum similarity score (0.1-1.0, default: 0.7)',
            tags: 'Optional: array of tags to filter by',
            importanceScore: 'Optional: minimum importance score',
            contextLevel: 'Optional: light|balanced|comprehensive',
            preferredProvider: 'Optional: AI provider for embeddings',
            searchType: 'Optional: vector|text|hybrid (default: hybrid)'
          },
          response: {
            memories: 'Array of memory objects with content, similarity, scores',
            searchStats: 'Search performance statistics',
            metadata: 'Request metadata and timing'
          }
        },
        search_modes: {
          vector: 'Uses vector embeddings for semantic similarity',
          text: 'Uses text-based similarity when vectors unavailable',
          hybrid: 'Tries vector search first, falls back to text search'
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Semantic Search',
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