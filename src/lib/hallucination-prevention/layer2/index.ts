// Layer 2: Context & Memory Management System - Main Exports
// =========================================================

// Core component exports
export { 
  EnhancedContextBuilder, 
  enhancedContextBuilder,
  type ContextLevel,
  type ContextBuilderRequest,
  type ContextBuilderResult,
  type LearningStyleDetection,
  type StudentProfile,
  type PerformanceMetrics,
  type ContextCompression
} from './EnhancedContextBuilder';

export { 
  KnowledgeBase, 
  knowledgeBase,
  type KnowledgeSource,
  type FactRecord,
  type KnowledgeSearchRequest,
  type KnowledgeSearchResult,
  type SourceReliability,
  type VerificationResult,
  type KnowledgeIntegration
} from './KnowledgeBase';

export { 
  ConversationMemoryManager, 
  conversationMemory as conversationMemoryManager,
  type ConversationMemory,
  type MemoryType,
  type MemoryPriority,
  type MemoryRetention,
  type MemorySearchRequest,
  type MemorySearchResult,
  type MemoryLinkingRequest,
  type MemoryOptimizationRequest,
  type MemoryOptimizationResult,
  type MemoryAnalytics,
  storeMemory,
  searchMemories,
  linkMemories,
  optimizeMemories,
  getMemoryAnalytics,
  updateMemoryQuality
} from './ConversationMemory';

export { 
  ContextOptimizer, 
  contextOptimizer,
  type ContextLevel as OptimizerContextLevel,
  type OptimizationStrategy,
  type TokenBudgetStrategy,
  type ContextOptimizationRequest,
  type ContextOptimizationResult,
  type TokenBudgetAllocation,
  type RelevanceScoringResult,
  type DynamicAdjustmentRequest,
  type DynamicAdjustmentResult,
  optimizeContext,
  allocateTokenBudget,
  calculateRelevanceScores,
  adjustContextDynamically
} from './ContextOptimizer';

// Type exports
export type {
  MemoryType,
  MemoryPriority,
  MemoryRetention,
  LinkType,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryLinkingRequest,
  MemoryOptimizationRequest,
  MemoryOptimizationResult,
  MemoryAnalytics,
  MemoryMetadata,
  InteractionData,
  QualityIndicator,
  SearchSnippet,
  CrossConversationLink,
  OptimizationStrategy,
  TokenBudgetStrategy,
  ContextOptimizationRequest,
  ContextOptimizationResult,
  TokenBudgetAllocation,
  RelevanceScoringResult,
  RelevanceFactor,
  DynamicAdjustmentRequest,
  DynamicAdjustmentResult,
  AppliedOptimization,
  CompressionStrategy
} from './ConversationMemory';

export type {
  ContextLevel,
  ContextBuilderRequest,
  ContextBuilderResult,
  LearningStyleDetection,
  StudentProfile,
  PerformanceMetrics,
  ContextCompression,
  ContextIntegration,
  ProfileContext,
  ConversationContext,
  KnowledgeContext,
  ExternalContext,
  SystemContext
} from './EnhancedContextBuilder';

export type {
  KnowledgeSource,
  FactRecord,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  SourceReliability,
  VerificationResult,
  KnowledgeIntegration,
  FactCheckRequest,
  FactCheckResult,
  SourceRanking,
  KnowledgeBaseMetrics
} from './KnowledgeBase';

// Unified Layer 2 Service
import { enhancedContextBuilder, type ContextBuilderRequest, type ContextBuilderResult } from './EnhancedContextBuilder';
import { knowledgeBase, type KnowledgeSearchRequest, type KnowledgeSearchResult } from './KnowledgeBase';
import { conversationMemory as conversationMemoryManager, type MemorySearchRequest, type MemoryOptimizationRequest } from './ConversationMemory';
import { contextOptimizer, type ContextOptimizationRequest, type ContextOptimizationResult } from './ContextOptimizer';
import { logError, logWarning, logInfo } from '@/lib/error-logger';
import type { AppDataContext } from '@/types/ai-service-manager';

export interface Layer2ProcessingRequest {
  userId: string;
  sessionId?: string;
  conversationId?: string;
  message: string;
  chatType?: 'general' | 'study_assistant';
  targetContextLevel: 'light' | 'recent' | 'selective' | 'full';
  maxTokens: number;
  includeMemory?: boolean;
  includeKnowledge?: boolean;
  includeOptimization?: boolean;
  contextData?: Partial<AppDataContext>;
  options?: Layer2Options;
  metadata?: Record<string, any>;
}

export interface Layer2ProcessingResult {
  context: Layer2Context;
  optimization: Layer2Optimization;
  memory: Layer2Memory;
  knowledge: Layer2Knowledge;
  processingTime: number;
  recommendations: string[];
  warnings: string[];
  metadata: {
    requestId: string;
    timestamp: string;
    contextLevel: string;
    processingStages: Layer2ProcessingStage[];
  };
}

export interface Layer2Context {
  level: 'light' | 'recent' | 'selective' | 'full';
  userProfile: any;
  conversationHistory: any[];
  knowledgeBase: any[];
  externalSources: any[];
  systemContext: any;
  totalTokens: number;
  compressionApplied: boolean;
  relevanceScores: Record<string, number>;
}

export interface Layer2Optimization {
  strategy: string;
  tokenReduction: {
    original: number;
    optimized: number;
    reductionRatio: number;
    tokensSaved: number;
  };
  qualityRetention: {
    relevance: number;
    completeness: number;
    criticalPreserved: boolean;
    recentPreserved: boolean;
  };
  appliedOptimizations: any[];
}

export interface Layer2Memory {
  memoriesStored: number;
  memoriesRetrieved: number;
  relevanceScore: number;
  qualityMetrics: any;
  crossConversationLinks: number;
}

export interface Layer2Knowledge {
  sourcesIntegrated: number;
  factsVerified: number;
  reliabilityScore: number;
  verificationStatus: Record<string, string>;
}

export interface Layer2Options {
  contextBuilderOptions?: any;
  knowledgeBaseOptions?: any;
  memoryOptions?: any;
  optimizerOptions?: any;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  strictMode?: boolean;
  fallbackEnabled?: boolean;
}

export interface Layer2ProcessingStage {
  stage: 'context_building' | 'knowledge_integration' | 'memory_processing' | 'optimization';
  status: 'completed' | 'failed' | 'skipped';
  duration: number;
  details?: string;
  error?: string;
}

export interface Layer2Configuration {
  defaultContextLevel: 'light' | 'recent' | 'selective' | 'full';
  defaultTokenLimit: number;
  enableContextBuilding: boolean;
  enableKnowledgeBase: boolean;
  enableMemoryManagement: boolean;
  enableOptimization: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  maxProcessingTime: number;
  strictMode: boolean;
  fallbackEnabled: boolean;
}

export interface Layer2Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  contextBuilding: {
    total: number;
    averageTime: number;
    successRate: number;
  };
  knowledgeIntegration: {
    total: number;
    averageTime: number;
    factsVerified: number;
  };
  memoryProcessing: {
    total: number;
    averageTime: number;
    memoriesStored: number;
  };
  optimization: {
    total: number;
    averageTime: number;
    averageReduction: number;
  };
  tokenEfficiency: {
    averageOriginalTokens: number;
    averageOptimizedTokens: number;
    averageReductionRatio: number;
  };
  errorRate: number;
  stageDurations: {
    contextBuilding: number[];
    knowledgeIntegration: number[];
    memoryProcessing: number[];
    optimization: number[];
  };
}

export class Layer2Service {
  private configuration: Layer2Configuration;
  private metrics: Layer2Metrics;
  private requestIdCounter: number = 0;
  private cryptoKey: string;

  constructor(config?: Partial<Layer2Configuration>) {
    this.configuration = {
      defaultContextLevel: 'selective',
      defaultTokenLimit: 2000,
      enableContextBuilding: true,
      enableKnowledgeBase: true,
      enableMemoryManagement: true,
      enableOptimization: true,
      enableLogging: true,
      enableMetrics: true,
      maxProcessingTime: 10000, // 10 seconds
      strictMode: false,
      fallbackEnabled: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.cryptoKey = process.env.LAYER2_ENCRYPTION_KEY || 'default-layer2-key';
  }

  /**
   * Main processing method - orchestrates all Layer 2 components
   */
  async processContext(request: Layer2ProcessingRequest): Promise<Layer2ProcessingResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const processingStages: Layer2ProcessingStage[] = [];
    
    try {
      logInfo('Layer 2 processing started', {
        componentName: 'Layer2Service',
        requestId,
        userId: request.userId,
        contextLevel: request.targetContextLevel,
        maxTokens: request.maxTokens
      });

      // Step 1: Context Building
      const contextStage = await this.executeStage('context_building', async () => {
        if (!this.configuration.enableContextBuilding) {
          return { level: request.targetContextLevel, userProfile: {}, conversationHistory: [], knowledgeBase: [], externalSources: [], systemContext: {}, totalTokens: 0, compressionApplied: false, relevanceScores: {} };
        }

        const contextRequest: ContextBuilderRequest = {
          userId: request.userId,
          conversationId: request.conversationId,
          targetLevel: request.targetContextLevel,
          maxTokens: request.maxTokens,
          includeProfile: true,
          includeHistory: true,
          includeLearningStyle: true,
          includePerformance: true,
          enableCompression: true,
          optimizationLevel: 'balanced'
        };

        return await enhancedContextBuilder.buildContext(contextRequest, request.contextData);
      });

      processingStages.push(contextStage);

      // Step 2: Knowledge Integration
      const knowledgeStage = await this.executeStage('knowledge_integration', async () => {
        if (!this.configuration.enableKnowledgeBase || !contextStage.details) {
          return { sourcesIntegrated: 0, factsVerified: 0, reliabilityScore: 0, verificationStatus: {} };
        }

        const searchRequest: KnowledgeSearchRequest = {
          userId: request.userId,
          query: request.message,
          limit: 10,
          minReliability: 0.7,
          includeVerification: true,
          searchType: 'semantic'
        };

        const knowledgeResult = await knowledgeBase.searchKnowledge(searchRequest);
        
        return {
          sourcesIntegrated: knowledgeResult.sources.length,
          factsVerified: knowledgeResult.facts.filter(f => f.verified).length,
          reliabilityScore: this.calculateOverallReliability(knowledgeResult.sources),
          verificationStatus: this.createVerificationStatus(knowledgeResult.sources)
        };
      });

      processingStages.push(knowledgeStage);

      // Step 3: Memory Processing
      const memoryStage = await this.executeStage('memory_processing', async () => {
        if (!this.configuration.enableMemoryManagement) {
          return { memoriesStored: 0, memoriesRetrieved: 0, relevanceScore: 0, qualityMetrics: {}, crossConversationLinks: 0 };
        }

        const memoryRequest: MemorySearchRequest = {
          userId: request.userId,
          conversationId: request.conversationId,
          maxResults: 20,
          minRelevanceScore: 0.5,
          includeExpired: false
        };

        const searchResult = await conversationMemoryManager.searchMemories(memoryRequest);
        
        return {
          memoriesStored: 1, // Assuming we store the current interaction
          memoriesRetrieved: searchResult.length,
          relevanceScore: searchResult.length > 0 ? 
            searchResult.reduce((sum, r) => sum + r.relevanceScore, 0) / searchResult.length : 0,
          qualityMetrics: this.calculateMemoryQualityMetrics(searchResult),
          crossConversationLinks: searchResult.filter(r => r.memory.metadata.crossConversationLinked).length
        };
      });

      processingStages.push(memoryStage);

      // Step 4: Context Optimization
      let optimizationStage: Layer2ProcessingStage;
      let finalContext: Layer2Context = contextStage.details!;
      
      if (this.configuration.enableOptimization && contextStage.details) {
        optimizationStage = await this.executeStage('optimization', async () => {
          const optimizationRequest: ContextOptimizationRequest = {
            userId: request.userId,
            conversationId: request.conversationId,
            originalContext: this.convertToOptimizableContext(contextStage.details!),
            targetLevel: request.targetContextLevel,
            maxTokens: request.maxTokens,
            optimizationStrategy: 'hierarchical',
            tokenBudgetStrategy: 'adaptive',
            preserveCritical: true,
            preserveRecent: true
          };

          return await contextOptimizer.optimizeContext(optimizationRequest);
        });

        processingStages.push(optimizationStage);

        if (optimizationStage.details) {
          finalContext = this.convertFromOptimizationResult(optimizationStage.details, contextStage.details);
        }
      } else {
        optimizationStage = {
          stage: 'optimization',
          status: 'skipped',
          duration: 0,
          details: 'Optimization disabled'
        };
        processingStages.push(optimizationStage);
      }

      // Generate recommendations and warnings
      const recommendations = this.generateRecommendations(
        contextStage.details,
        knowledgeStage.details,
        memoryStage.details,
        optimizationStage.details,
        request
      );
      
      const warnings = this.generateWarnings(
        contextStage.details,
        knowledgeStage.details,
        memoryStage.details,
        optimizationStage.details,
        request
      );

      const processingTime = Date.now() - startTime;
      
      const result: Layer2ProcessingResult = {
        context: finalContext,
        optimization: optimizationStage.details ? {
          strategy: optimizationStage.details.optimizationStrategy,
          tokenReduction: optimizationStage.details.tokenReduction,
          qualityRetention: optimizationStage.details.qualityMetrics,
          appliedOptimizations: optimizationStage.details.appliedOptimizations
        } : {
          strategy: 'none',
          tokenReduction: { original: 0, optimized: 0, reductionRatio: 0, tokensSaved: 0 },
          qualityRetention: { relevance: 1, completeness: 1, criticalPreserved: true, recentPreserved: true },
          appliedOptimizations: []
        },
        memory: memoryStage.details || {
          memoriesStored: 0,
          memoriesRetrieved: 0,
          relevanceScore: 0,
          qualityMetrics: {},
          crossConversationLinks: 0
        },
        knowledge: knowledgeStage.details || {
          sourcesIntegrated: 0,
          factsVerified: 0,
          reliabilityScore: 0,
          verificationStatus: {}
        },
        processingTime,
        recommendations,
        warnings,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          contextLevel: request.targetContextLevel,
          processingStages
        }
      };

      // Update metrics
      this.updateMetrics(result, processingTime, true);

      logInfo('Layer 2 processing completed successfully', {
        componentName: 'Layer2Service',
        requestId,
        processingTime,
        contextLevel: result.context.level,
        totalTokens: result.context.totalTokens,
        optimizationReduction: result.optimization.tokenReduction.reductionRatio
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorResult = this.createErrorResult(request, {
        stage: 'context_building',
        status: 'failed',
        duration: processingTime,
        error: error instanceof Error ? error.message : String(error)
      }, requestId);

      this.updateMetrics(errorResult, processingTime, false);

      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer2Service',
        requestId,
        processingTime,
        userId: request.userId
      });

      return errorResult;
    }
  }

  /**
   * Quick context building - for fast responses
   */
  async buildContextOnly(
    userId: string,
    contextLevel: 'light' | 'recent' | 'selective' | 'full' = 'light',
    maxTokens: number = 500,
    contextData?: Partial<AppDataContext>
  ): Promise<any> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const contextRequest: ContextBuilderRequest = {
        userId,
        targetLevel: contextLevel,
        maxTokens,
        includeProfile: true,
        includeHistory: true,
        includeLearningStyle: true,
        includePerformance: true,
        enableCompression: contextLevel !== 'full',
        optimizationLevel: contextLevel === 'light' ? 'aggressive' : 'balanced'
      };

      const result = await enhancedContextBuilder.buildContext(contextRequest, contextData);

      logInfo('Quick context build completed', {
        componentName: 'Layer2Service',
        requestId,
        userId,
        contextLevel,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer2Service',
        operation: 'build_context_only',
        requestId,
        userId
      });

      return {
        level: contextLevel,
        userProfile: {},
        conversationHistory: [],
        knowledgeBase: [],
        externalSources: [],
        systemContext: {},
        totalTokens: 0,
        compressionApplied: false,
        relevanceScores: {}
      };
    }
  }

  /**
   * Knowledge search only - for fact checking and verification
   */
  async searchKnowledgeOnly(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      minReliability?: number;
      includeVerification?: boolean;
    }
  ): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const searchRequest: KnowledgeSearchRequest = {
        userId,
        query,
        limit: options?.limit || 10,
        minReliability: options?.minReliability || 0.7,
        includeVerification: options?.includeVerification || true,
        searchType: 'semantic'
      };

      const result = await knowledgeBase.searchKnowledge(searchRequest);

      logInfo('Knowledge search completed', {
        componentName: 'Layer2Service',
        requestId,
        userId,
        query: query.substring(0, 50),
        resultCount: result.sources.length,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer2Service',
        operation: 'search_knowledge_only',
        requestId,
        userId
      });

      return {
        sources: [],
        facts: [],
        totalResults: 0,
        searchMetadata: {
          query,
          totalResults: 0,
          processingTime: Date.now() - startTime,
          searchType: 'semantic'
        }
      };
    }
  }

  /**
   * Memory processing only - for conversation continuity
   */
  async processMemoryOnly(
    userId: string,
    conversationId?: string,
    options?: {
      maxResults?: number;
      minRelevanceScore?: number;
      includeOptimization?: boolean;
    }
  ): Promise<any> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const memoryRequest: MemorySearchRequest = {
        userId,
        conversationId,
        maxResults: options?.maxResults || 20,
        minRelevanceScore: options?.minRelevanceScore || 0.5,
        includeExpired: false
      };

      const searchResult = await conversationMemoryManager.searchMemories(memoryRequest);
      
      let optimizationResult = null;
      if (options?.includeOptimization && searchResult.length > 0) {
        const optimizationRequest: MemoryOptimizationRequest = {
          userId,
          conversationId,
          optimizationType: 'linking',
          preserveRecent: true
        };
        
        optimizationResult = await conversationMemoryManager.optimizeMemories(optimizationRequest);
      }

      logInfo('Memory processing completed', {
        componentName: 'Layer2Service',
        requestId,
        userId,
        conversationId,
        memoriesFound: searchResult.length,
        processingTime: Date.now() - startTime
      });

      return {
        memories: searchResult,
        optimization: optimizationResult,
        summary: {
          totalMemories: searchResult.length,
          averageRelevance: searchResult.length > 0 ? 
            searchResult.reduce((sum, r) => sum + r.relevanceScore, 0) / searchResult.length : 0,
          crossConversationLinks: searchResult.filter(r => r.memory.metadata.crossConversationLinked).length
        }
      };

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer2Service',
        operation: 'process_memory_only',
        requestId,
        userId
      });

      return {
        memories: [],
        optimization: null,
        summary: {
          totalMemories: 0,
          averageRelevance: 0,
          crossConversationLinks: 0
        }
      };
    }
  }

  /**
   * Context optimization only - for token budget management
   */
  async optimizeContextOnly(
    context: any,
    userId: string,
    maxTokens: number,
    strategy: 'compression' | 'truncation' | 'summarization' | 'relevance_filtering' | 'hierarchical' = 'hierarchical'
  ): Promise<ContextOptimizationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const optimizationRequest: ContextOptimizationRequest = {
        userId,
        originalContext: this.convertToOptimizableContext(context),
        targetLevel: context.level || 'selective',
        maxTokens,
        optimizationStrategy: strategy,
        tokenBudgetStrategy: 'adaptive',
        preserveCritical: true,
        preserveRecent: true
      };

      const result = await contextOptimizer.optimizeContext(optimizationRequest);

      logInfo('Context optimization completed', {
        componentName: 'Layer2Service',
        requestId,
        userId,
        originalTokens: result.tokenReduction.original,
        optimizedTokens: result.tokenReduction.optimized,
        reductionRatio: result.tokenReduction.reductionRatio,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'Layer2Service',
        operation: 'optimize_context_only',
        requestId,
        userId
      });

      throw new Error(`Context optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Layer2Metrics {
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
  updateConfiguration(config: Partial<Layer2Configuration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): Layer2Configuration {
    return { ...this.configuration };
  }

  // Private helper methods

  private async executeStage<T>(
    stage: Layer2ProcessingStage['stage'],
    operation: () => Promise<T>
  ): Promise<Layer2ProcessingStage & { details?: T; error?: string }> {
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
    request: Layer2ProcessingRequest,
    failedStage: Layer2ProcessingStage,
    requestId: string
  ): Layer2ProcessingResult {
    return {
      context: {
        level: request.targetContextLevel,
        userProfile: {},
        conversationHistory: [],
        knowledgeBase: [],
        externalSources: [],
        systemContext: {},
        totalTokens: 0,
        compressionApplied: false,
        relevanceScores: {}
      },
      optimization: {
        strategy: 'failed',
        tokenReduction: { original: 0, optimized: 0, reductionRatio: 0, tokensSaved: 0 },
        qualityRetention: { relevance: 0, completeness: 0, criticalPreserved: false, recentPreserved: false },
        appliedOptimizations: []
      },
      memory: {
        memoriesStored: 0,
        memoriesRetrieved: 0,
        relevanceScore: 0,
        qualityMetrics: {},
        crossConversationLinks: 0
      },
      knowledge: {
        sourcesIntegrated: 0,
        factsVerified: 0,
        reliabilityScore: 0,
        verificationStatus: {}
      },
      processingTime: failedStage.duration,
      recommendations: ['Please try again or contact support if the issue persists.'],
      warnings: [`Processing failed at ${failedStage.stage} stage: ${failedStage.error}`],
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        contextLevel: request.targetContextLevel,
        processingStages: [failedStage]
      }
    };
  }

  private calculateOverallReliability(sources: any[]): number {
    if (sources.length === 0) return 0;
    return sources.reduce((sum, source) => sum + (source.reliability || 0), 0) / sources.length;
  }

  private createVerificationStatus(sources: any[]): Record<string, string> {
    const status: Record<string, string> = {};
    for (const source of sources) {
      status[source.id] = source.verificationStatus || 'unknown';
    }
    return status;
  }

  private calculateMemoryQualityMetrics(searchResult: any[]): any {
    if (searchResult.length === 0) return {};

    const totalQuality = searchResult.reduce((sum, result) => sum + result.memory.qualityScore, 0);
    const averageQuality = totalQuality / searchResult.length;

    const priorityDistribution = searchResult.reduce((dist, result) => {
      const priority = result.memory.priority;
      dist[priority] = (dist[priority] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      averageQuality,
      totalMemories: searchResult.length,
      priorityDistribution,
      highQualityCount: searchResult.filter(r => r.memory.qualityScore > 0.8).length
    };
  }

  private convertToOptimizableContext(context: Layer2Context): any {
    return {
      userProfile: context.userProfile,
      conversationHistory: context.conversationHistory,
      knowledgeBase: context.knowledgeBase,
      externalSources: context.externalSources,
      systemContext: context.systemContext,
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        contextHash: '',
        optimizationHistory: [],
        accessPatterns: [],
        qualityMetrics: {
          averageRelevance: Object.values(context.relevanceScores).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(context.relevanceScores).length || 0,
          averageQuality: 0.8,
          completeness: 1.0,
          freshness: 0.8,
          consistency: 0.9
        }
      },
      totalTokens: context.totalTokens
    };
  }

  private convertFromOptimizationResult(optimizationResult: ContextOptimizationResult, originalContext: Layer2Context): Layer2Context {
    const optimizedContext = optimizationResult.optimizedContext;
    
    return {
      level: originalContext.level,
      userProfile: optimizedContext.userProfile || originalContext.userProfile,
      conversationHistory: optimizedContext.conversationHistory || originalContext.conversationHistory,
      knowledgeBase: optimizedContext.knowledgeBase || originalContext.knowledgeBase,
      externalSources: optimizedContext.externalSources || originalContext.externalSources,
      systemContext: optimizedContext.systemContext || originalContext.systemContext,
      totalTokens: optimizationResult.tokenReduction.optimized,
      compressionApplied: optimizationResult.appliedOptimizations.some(opt => opt.type === 'compression'),
      relevanceScores: originalContext.relevanceScores
    };
  }

  private generateRecommendations(
    context: any,
    knowledge: any,
    memory: any,
    optimization: any,
    request: Layer2ProcessingRequest
  ): string[] {
    const recommendations: string[] = [];

    // Context-based recommendations
    if (context && context.totalTokens > request.maxTokens * 0.9) {
      recommendations.push('Consider using a lighter context level for better token efficiency');
    }

    // Knowledge-based recommendations
    if (knowledge && knowledge.sourcesIntegrated < 3) {
      recommendations.push('Consider expanding knowledge base search for better fact coverage');
    }

    // Memory-based recommendations
    if (memory && memory.relevanceScore < 0.6) {
      recommendations.push('Improve memory relevance scoring for better conversation continuity');
    }

    // Optimization-based recommendations
    if (optimization && optimization.tokenReduction.reductionRatio > 0.5) {
      recommendations.push('High token reduction may impact context quality - consider adjusting strategy');
    }

    return recommendations;
  }

  private generateWarnings(
    context: any,
    knowledge: any,
    memory: any,
    optimization: any,
    request: Layer2ProcessingRequest
  ): string[] {
    const warnings: string[] = [];

    // Context warnings
    if (context && context.totalTokens > request.maxTokens) {
      warnings.push('Context exceeds token limit - optimization required');
    }

    // Knowledge warnings
    if (knowledge && knowledge.reliabilityScore < 0.5) {
      warnings.push('Low knowledge base reliability - fact verification may be affected');
    }

    // Memory warnings
    if (memory && memory.memoriesRetrieved === 0) {
      warnings.push('No relevant memories found - conversation continuity may be limited');
    }

    // Optimization warnings
    if (optimization && !optimization.qualityRetention.criticalPreserved) {
      warnings.push('Critical information may have been lost during optimization');
    }

    return warnings;
  }

  private updateMetrics(result: Layer2ProcessingResult, processingTime: number, success: boolean): void {
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

    // Update component-specific metrics
    if (success && result.context) {
      this.metrics.tokenEfficiency.averageOriginalTokens += result.context.totalTokens;
      this.metrics.tokenEfficiency.averageOptimizedTokens += result.optimization.tokenReduction.optimized;
      
      if (result.optimization.tokenReduction.reductionRatio > 0) {
        this.metrics.tokenEfficiency.averageReductionRatio += result.optimization.tokenReduction.reductionRatio;
      }
    }
  }

  private initializeMetrics(): Layer2Metrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      contextBuilding: {
        total: 0,
        averageTime: 0,
        successRate: 0
      },
      knowledgeIntegration: {
        total: 0,
        averageTime: 0,
        factsVerified: 0
      },
      memoryProcessing: {
        total: 0,
        averageTime: 0,
        memoriesStored: 0
      },
      optimization: {
        total: 0,
        averageTime: 0,
        averageReduction: 0
      },
      tokenEfficiency: {
        averageOriginalTokens: 0,
        averageOptimizedTokens: 0,
        averageReductionRatio: 0
      },
      errorRate: 0,
      stageDurations: {
        contextBuilding: [],
        knowledgeIntegration: [],
        memoryProcessing: [],
        optimization: []
      }
    };
  }

  private generateRequestId(): string {
    return `layer2_${Date.now()}_${++this.requestIdCounter}`;
  }
}

// Export singleton instance
export const layer2Service = new Layer2Service();

// Convenience functions
export const processContext = (request: Layer2ProcessingRequest) => 
  layer2Service.processContext(request);

export const buildContextOnly = (
  userId: string, 
  contextLevel?: 'light' | 'recent' | 'selective' | 'full', 
  maxTokens?: number, 
  contextData?: Partial<AppDataContext>
) => layer2Service.buildContextOnly(userId, contextLevel, maxTokens, contextData);

export const searchKnowledgeOnly = (
  userId: string, 
  query: string, 
  options?: { limit?: number; minReliability?: number; includeVerification?: boolean }
) => layer2Service.searchKnowledgeOnly(userId, query, options);

export const processMemoryOnly = (
  userId: string, 
  conversationId?: string, 
  options?: { maxResults?: number; minRelevanceScore?: number; includeOptimization?: boolean }
) => layer2Service.processMemoryOnly(userId, conversationId, options);

export const optimizeContextOnly = (
  context: any, 
  userId: string, 
  maxTokens: number, 
  strategy?: 'compression' | 'truncation' | 'summarization' | 'relevance_filtering' | 'hierarchical'
) => layer2Service.optimizeContextOnly(context, userId, maxTokens, strategy);