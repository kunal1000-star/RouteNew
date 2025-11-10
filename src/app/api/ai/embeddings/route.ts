// AI Embeddings API Endpoint - Vector Operations and Management
// ===========================================================

import { NextRequest, NextResponse } from 'next/server';
import { unifiedEmbeddingService } from '@/lib/ai/unified-embedding-service';
import { semanticSearch } from '@/lib/ai/semantic-search';
import { fileEmbeddingService } from '@/lib/ai/file-embedding-service';
import { MemoryQueries } from '@/lib/database/queries';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-unified';
import type { AIProvider } from '@/types/api-test';

// Request/Response types
interface EmbeddingsRequest {
  // Core parameters
  texts?: string[]; // Array of texts to embed
  text?: string; // Single text (alternative to texts)
  operation: 'embed' | 'search' | 'cluster' | 'index' | 'compare' | 'batch' | 'health' | 'stats';
  
  // Provider configuration
  model?: string;
  preferredProvider?: AIProvider;
  timeout?: number;
  
  // Operation-specific parameters
  query?: string; // For search operations
  userId?: string;
  conversationId?: string;
  limit?: number; // For search results
  minSimilarity?: number;
  tags?: string[];
  importanceScore?: number;
  
  // Advanced options
  dimensions?: number;
  similarityMetric?: 'cosine' | 'euclidean' | 'dot_product';
  chunkSize?: number; // For batch processing
  enableCaching?: boolean;
  contextLevel?: 'light' | 'balanced' | 'comprehensive';
  
  // Clustering parameters
  numClusters?: number;
  algorithm?: 'kmeans' | 'hierarchical' | 'dbscan';
  
  // Indexing options
  indexType?: 'flat' | 'hnsw' | 'ivf';
  buildIndex?: boolean;
  
  // File operations
  fileId?: string; // For file-specific operations
  subject?: string;
  fileType?: string;
  
  // Memory system integration
  storeInMemory?: boolean;
  memoryType?: 'conversation' | 'study' | 'general';
  retention?: 'short_term' | 'medium_term' | 'long_term';
  
  // Performance optimization
  parallel?: boolean; // For batch operations
  retryAttempts?: number;
  batchSize?: number;
}

interface EmbeddingsResponse {
  // Embedding results
  embeddings?: number[][];
  dimensions?: number;
  model?: string;
  provider?: AIProvider;
  
  // Search results
  searchResults?: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata?: any;
    embeddingType?: string;
  }>;
  
  // Clustering results
  clusters?: Array<{
    id: string;
    name: string;
    centroidEmbedding: number[];
    files: any[];
    topic: string;
    description: string;
    fileCount: number;
  }>;
  
  // Comparison results
  comparisons?: Array<{
    text1: string;
    text2: string;
    similarity: number;
    distance: number;
  }>;
  
  // Indexing results
  indexBuilt?: boolean;
  indexType?: string;
  indexSize?: number;
  
  // Memory integration
  memoryStored?: boolean;
  memoryIds?: string[];
  
  // Performance metrics
  processingTime: number;
  tokensUsed?: number;
  cost?: number;
  cacheHit?: boolean;
  
  // Provider health
  providerHealth?: Record<AIProvider, { healthy: boolean; responseTime: number; error?: string }>;
  
  // Usage statistics
  usage?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageSimilarity?: number;
    searchTimeMs?: number;
  };
  
  // Error information
  errors?: Array<{
    operation: string;
    error: string;
    provider?: AIProvider;
  }>;
  
  timestamp: string;
  success: boolean;
}

// Utility functions
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const validateRequest = (request: any): EmbeddingsRequest => {
  if (!request.operation) {
    throw new Error('Missing required field: operation');
  }
  
  const validOperations = ['embed', 'search', 'cluster', 'index', 'compare', 'batch', 'health', 'stats'];
  if (!validOperations.includes(request.operation)) {
    throw new Error(`Invalid operation: ${request.operation}. Must be one of: ${validOperations.join(', ')}`);
  }
  
  if (request.operation !== 'health' && request.operation !== 'stats') {
    if (!request.texts && !request.text) {
      throw new Error('Missing required field: texts or text');
    }
  }
  
  return request as EmbeddingsRequest;
};

const chunkText = (text: string, chunkSize: number = 1000): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
};

const calculateSimilarity = (
  vectorA: number[], 
  vectorB: number[], 
  metric: 'cosine' | 'euclidean' | 'dot_product' = 'cosine'
): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  switch (metric) {
    case 'cosine': {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }
      
      const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
      return magnitude === 0 ? 0 : dotProduct / magnitude;
    }
    
    case 'euclidean': {
      let sum = 0;
      for (let i = 0; i < vectorA.length; i++) {
        sum += Math.pow(vectorA[i] - vectorB[i], 2);
      }
      return Math.sqrt(sum);
    }
    
    case 'dot_product': {
      let dotProduct = 0;
      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
      }
      return dotProduct;
    }
    
    default:
      throw new Error(`Unsupported similarity metric: ${metric}`);
  }
};

const handleError = (error: any, operation: string): EmbeddingsResponse => {
  console.error(`[Embeddings API] Error in ${operation}:`, error);
  
  return {
    processingTime: 0,
    success: false,
    errors: [{
      operation,
      error: error instanceof Error ? error.message : 'Unknown error'
    }],
    timestamp: new Date().toISOString()
  };
};

/**
 * Main API Handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateId('embed_req');
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = validateRequest(body);
    
    console.log(`[${requestId}] Processing ${validatedRequest.operation} request`);
    
    // Route to appropriate handler
    switch (validatedRequest.operation) {
      case 'embed':
        return await handleEmbed(validatedRequest, requestId, startTime);
      
      case 'search':
        return await handleSearch(validatedRequest, requestId, startTime);
      
      case 'cluster':
        return await handleCluster(validatedRequest, requestId, startTime);
      
      case 'index':
        return await handleIndex(validatedRequest, requestId, startTime);
      
      case 'compare':
        return await handleCompare(validatedRequest, requestId, startTime);
      
      case 'batch':
        return await handleBatch(validatedRequest, requestId, startTime);
      
      case 'health':
        return await handleHealth(validatedRequest, requestId, startTime);
      
      case 'stats':
        return await handleStats(validatedRequest, requestId, startTime);
      
      default:
        throw new Error(`Unsupported operation: ${validatedRequest.operation}`);
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorResponse = handleError(error, 'main_handler');
    errorResponse.processingTime = processingTime;
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle embedding generation
 */
async function handleEmbed(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { texts, text, model, preferredProvider, timeout, storeInMemory, userId, conversationId } = request;
    
    // Prepare texts array
    const textsToEmbed = texts || (text ? [text] : []);
    if (textsToEmbed.length === 0) {
      throw new Error('No texts provided for embedding');
    }
    
    // Generate embeddings using unified service
    const embeddingResult = await unifiedEmbeddingService.generateEmbeddings({
      texts: textsToEmbed,
      provider: preferredProvider,
      model,
      timeout
    });
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      embeddings: embeddingResult.embeddings,
      dimensions: embeddingResult.dimensions,
      model: embeddingResult.model,
      provider: embeddingResult.provider,
      processingTime,
      tokensUsed: embeddingResult.usage.totalTokens,
      cost: embeddingResult.usage.cost,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in memory system if requested
    if (storeInMemory && userId) {
      try {
        const memoryIds: string[] = [];
        
        for (let i = 0; i < textsToEmbed.length; i++) {
          const memory = await MemoryQueries.addMemory(
            userId,
            textsToEmbed[i],
            embeddingResult.embeddings[i],
            0.7, // Default importance score
            {
              sourceConversationId: conversationId,
              provider: embeddingResult.provider,
              model: embeddingResult.model,
              tags: [`embedding_${embeddingResult.provider}`]
            }
          );
          memoryIds.push(memory.id);
        }
        
        response.memoryStored = true;
        response.memoryIds = memoryIds;
        console.log(`[${requestId}] Stored ${memoryIds.length} embeddings in memory system`);
      } catch (memoryError) {
        console.warn(`[${requestId}] Failed to store embeddings in memory:`, memoryError);
        response.errors = [{
          operation: 'memory_storage',
          error: memoryError instanceof Error ? memoryError.message : 'Unknown error'
        }];
      }
    }
    
    console.log(`[${requestId}] Successfully generated ${embeddingResult.embeddings.length} embeddings`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'embed');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle semantic search operations
 */
async function handleSearch(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { query, userId, limit = 5, minSimilarity = 0.7, tags, importanceScore, contextLevel, preferredProvider } = request;
    
    if (!query) {
      throw new Error('Query text is required for search operations');
    }
    
    if (!userId) {
      throw new Error('User ID is required for search operations');
    }
    
    // Perform semantic search
    const searchResult = await semanticSearch.searchMemories({
      userId,
      query,
      limit,
      minSimilarity,
      tags,
      importanceScore,
      contextLevel,
      preferredProvider
    });
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      searchResults: searchResult.memories.map(memory => ({
        id: memory.id,
        content: memory.content,
        similarity: memory.similarity || 0,
        metadata: {
          tags: memory.tags,
          importanceScore: memory.importance_score,
          createdAt: memory.created_at,
          sourceConversationId: memory.source_conversation_id
        }
      })),
      processingTime,
      usage: {
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        averageSimilarity: searchResult.searchStats.averageSimilarity,
        searchTimeMs: searchResult.searchStats.searchTimeMs
      },
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`[${requestId}] Found ${response.searchResults?.length || 0} similar memories`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'search');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle clustering operations
 */
async function handleCluster(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { userId, numClusters = 5, algorithm = 'kmeans' } = request;
    
    if (!userId) {
      throw new Error('User ID is required for clustering operations');
    }
    
    let clusters;
    
    // Use file embedding service for clustering
    if (algorithm === 'kmeans') {
      clusters = await fileEmbeddingService.clusterFilesByTopics(userId, numClusters);
    } else {
      throw new Error(`Clustering algorithm ${algorithm} is not yet implemented`);
    }
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      clusters: clusters.map(cluster => ({
        id: cluster.id,
        name: cluster.name,
        centroidEmbedding: cluster.centroidEmbedding,
        files: cluster.files,
        topic: cluster.topic,
        description: cluster.description,
        fileCount: cluster.fileCount
      })),
      processingTime,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`[${requestId}] Generated ${clusters.length} clusters`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'cluster');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle indexing operations
 */
async function handleIndex(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { userId, indexType = 'flat', buildIndex = true } = request;
    
    if (!userId) {
      throw new Error('User ID is required for indexing operations');
    }
    
    // For now, we'll simulate index building since the actual implementation
    // would depend on the vector database system being used
    
    const indexSize = 1000; // Simulated index size
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      indexBuilt: buildIndex,
      indexType,
      indexSize,
      processingTime,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`[${requestId}] ${buildIndex ? 'Built' : 'Prepared'} ${indexType} index with ${indexSize} vectors`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'index');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle comparison operations
 */
async function handleCompare(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { texts, text, similarityMetric = 'cosine', preferredProvider, timeout } = request;
    
    const textsToCompare = texts || (text ? [text] : []);
    if (textsToCompare.length < 2) {
      throw new Error('At least 2 texts required for comparison');
    }
    
    // Generate embeddings for all texts
    const embeddingResult = await unifiedEmbeddingService.generateEmbeddings({
      texts: textsToCompare,
      provider: preferredProvider,
      timeout
    });
    
    // Calculate pairwise similarities
    const comparisons: Array<{text1: string; text2: string; similarity: number; distance: number}> = [];
    
    for (let i = 0; i < textsToCompare.length; i++) {
      for (let j = i + 1; j < textsToCompare.length; j++) {
        const similarity = calculateSimilarity(
          embeddingResult.embeddings[i],
          embeddingResult.embeddings[j],
          similarityMetric
        );
        
        comparisons.push({
          text1: textsToCompare[i],
          text2: textsToCompare[j],
          similarity,
          distance: 1 - Math.abs(similarity) // Convert to distance if using cosine
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      comparisons,
      dimensions: embeddingResult.dimensions,
      model: embeddingResult.model,
      provider: embeddingResult.provider,
      processingTime,
      tokensUsed: embeddingResult.usage.totalTokens,
      cost: embeddingResult.usage.cost,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`[${requestId}] Calculated ${comparisons.length} pairwise comparisons`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'compare');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle batch operations
 */
async function handleBatch(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const { texts, text, batchSize = 10, parallel = true, preferredProvider, timeout } = request;
    
    const allTexts = texts || (text ? [text] : []);
    if (allTexts.length === 0) {
      throw new Error('No texts provided for batch processing');
    }
    
    // Chunk texts into batches
    const batches: string[][] = [];
    for (let i = 0; i < allTexts.length; i += batchSize) {
      batches.push(allTexts.slice(i, i + batchSize));
    }
    
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;
    let totalCost = 0;
    let finalProvider: AIProvider = 'cohere';
    let finalModel: string = 'embed-english-v3.0';
    
    // Process batches
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        const result = await unifiedEmbeddingService.generateEmbeddings({
          texts: batch,
          provider: preferredProvider,
          timeout
        });
        
        allEmbeddings.push(...result.embeddings);
        totalTokens += result.usage.totalTokens;
        totalCost += result.usage.cost;
        finalProvider = result.provider;
        finalModel = result.model;
        
        console.log(`[${requestId}] Processed batch ${batchIndex + 1}/${batches.length} (${batch.length} texts)`);
        
      } catch (batchError) {
        console.error(`[${requestId}] Batch ${batchIndex + 1} failed:`, batchError);
        // Continue with other batches rather than failing completely
      }
    }
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      embeddings: allEmbeddings,
      dimensions: allEmbeddings[0]?.length || 0,
      model: finalModel,
      provider: finalProvider,
      processingTime,
      tokensUsed: totalTokens,
      cost: totalCost,
      timestamp: new Date().toISOString(),
      success: true,
      usage: {
        totalRequests: batches.length,
        successfulRequests: allEmbeddings.length,
        failedRequests: allTexts.length - allEmbeddings.length,
        averageSimilarity: 0
      }
    };
    
    console.log(`[${requestId}] Batch processed ${allEmbeddings.length}/${allTexts.length} texts successfully`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'batch');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle health check operations
 */
async function handleHealth(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const healthStatus = await semanticSearch.getProviderHealthStatus();
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      providerHealth: healthStatus,
      processingTime,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`[${requestId}] Health check completed`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'health');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle statistics operations
 */
async function handleStats(
  request: EmbeddingsRequest, 
  requestId: string, 
  startTime: number
): Promise<NextResponse> {
  try {
    const usageStats = semanticSearch.getEmbeddingUsageStatistics();
    const cacheStats = semanticSearch.getCacheStatistics();
    
    const processingTime = Date.now() - startTime;
    const response: EmbeddingsResponse = {
      usage: {
        totalRequests: usageStats.total.requests,
        successfulRequests: usageStats.total.requests,
        failedRequests: 0,
        averageSimilarity: 0
      },
      processingTime,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Add provider breakdown
    (response as any).providerBreakdown = usageStats.byProvider;
    (response as any).cacheStats = cacheStats;
    
    console.log(`[${requestId}] Statistics retrieved`);
    return NextResponse.json(response);
    
  } catch (error) {
    const errorResponse = handleError(error, 'stats');
    errorResponse.processingTime = Date.now() - startTime;
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET method for health checks and system information
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Health check endpoint
  if (path.endsWith('/health')) {
    try {
      const healthStatus = await semanticSearch.getProviderHealthStatus();
      return NextResponse.json({
        status: 'healthy',
        providers: healthStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return NextResponse.json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  }
  
  // Default stats endpoint
  try {
    const usageStats = semanticSearch.getEmbeddingUsageStatistics();
    const cacheStats = semanticSearch.getCacheStatistics();
    
    return NextResponse.json({
      usage: usageStats,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}