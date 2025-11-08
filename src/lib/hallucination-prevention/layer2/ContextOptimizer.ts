// Layer 2: Context & Memory Management System
// ============================================
// ContextOptimizer - Context optimization with token budget management,
// relevance scoring algorithms, context compression and summarization,
// and dynamic context adjustment

import { logError, logWarning, logInfo } from '@/lib/error-logger';
import { createHash } from 'crypto';

export type ContextLevel = 'light' | 'recent' | 'selective' | 'full';
export type OptimizationStrategy = 'compression' | 'truncation' | 'summarization' | 'relevance_filtering' | 'hierarchical';
export type CompressionLevel = 'low' | 'medium' | 'high' | 'aggressive';
export type TokenBudgetStrategy = 'strict' | 'flexible' | 'adaptive' | 'priority_based';

export interface ContextOptimizationRequest {
  userId: string;
  conversationId?: string;
  originalContext: OptimizableContext;
  targetLevel: ContextLevel;
  maxTokens: number;
  optimizationStrategy: OptimizationStrategy;
  tokenBudgetStrategy: TokenBudgetStrategy;
  compressionLevel?: CompressionLevel;
  preserveCritical?: boolean;
  preserveRecent?: boolean;
  includeMetadata?: boolean;
  qualityThreshold?: number;
  relevanceThreshold?: number;
}

export interface OptimizableContext {
  userProfile?: UserProfileContext;
  conversationHistory?: ConversationContext[];
  knowledgeBase?: KnowledgeContext[];
  externalSources?: ExternalContext[];
  systemContext?: SystemContext;
  metadata?: ContextMetadata;
  totalTokens?: number;
}

export interface UserProfileContext {
  id: string;
  name?: string;
  academicLevel: string;
  subjects: string[];
  strengths: string[];
  weaknesses: string[];
  studyGoals: string[];
  learningStyle: LearningStyleData;
  preferences: UserPreferences;
  progressData: StudyProgress;
  totalTokens: number;
}

export interface ConversationContext {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokenCount: number;
  relevanceScore: number;
  qualityScore: number;
  contextValue: 'critical' | 'important' | 'contextual' | 'supplementary';
  category?: string;
  tags: string[];
  linkedToKnowledgeBase: boolean;
  crossConversationLinked: boolean;
}

export interface KnowledgeContext {
  id: string;
  title: string;
  content: string;
  source: string;
  reliability: number;
  relevanceScore: number;
  lastUpdated: Date;
  tokenCount: number;
  verificationStatus: 'verified' | 'pending' | 'disputed';
  category: string;
  tags: string[];
  factType: 'fact' | 'opinion' | 'hypothesis' | 'definition';
}

export interface ExternalContext {
  type: 'api' | 'database' | 'external_service';
  source: string;
  data: any;
  lastAccessed: Date;
  reliability: number;
  tokenCount: number;
  contextValue: 'critical' | 'important' | 'contextual';
}

export interface SystemContext {
  sessionInfo: SessionInfo;
  systemStatus: SystemStatus;
  availableFeatures: string[];
  currentTime: Date;
  tokenCount: number;
}

export interface ContextMetadata {
  createdAt: Date;
  lastUpdated: Date;
  version: number;
  contextHash: string;
  optimizationHistory: OptimizationRecord[];
  accessPatterns: AccessPattern[];
  qualityMetrics: ContextQualityMetrics;
}

export interface LearningStyleData {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
  preferredFormats: string[];
}

export interface UserPreferences {
  responseFormat: 'plain_text' | 'structured' | 'step_by_step' | 'bulleted';
  detailLevel: 'concise' | 'detailed' | 'comprehensive';
  languageStyle: 'casual' | 'formal' | 'academic';
  feedbackPreference: 'immediate' | 'periodic' | 'end_of_session';
}

export interface StudyProgress {
  totalBlocksCompleted: number;
  currentStreak: number;
  totalStudyTime: number;
  subjectProgress: Record<string, number>;
  recentAchievements: string[];
  learningVelocity: number;
}

export interface SessionInfo {
  sessionId: string;
  startTime: Date;
  duration: number;
  interactionCount: number;
  contextSwitches: number;
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'maintenance';
  activeServices: string[];
  performance: PerformanceMetrics;
  alerts: string[];
}

export interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  userSatisfaction: number;
  contextRelevance: number;
}

export interface OptimizationRecord {
  id: string;
  timestamp: Date;
  strategy: OptimizationStrategy;
  originalTokens: number;
  optimizedTokens: number;
  reductionRatio: number;
  qualityRetention: number;
  metadata: Record<string, any>;
}

export interface AccessPattern {
  timestamp: Date;
  contextType: string;
  accessCount: number;
  relevanceScore: number;
}

export interface ContextQualityMetrics {
  averageRelevance: number;
  averageQuality: number;
  completeness: number;
  freshness: number;
  consistency: number;
}

export interface ContextOptimizationResult {
  optimizationId: string;
  originalContext: OptimizableContext;
  optimizedContext: OptimizableContext;
  optimizationStrategy: OptimizationStrategy;
  tokenBudgetStrategy: TokenBudgetStrategy;
  tokenReduction: {
    original: number;
    optimized: number;
    reductionRatio: number;
    tokensSaved: number;
  };
  qualityMetrics: {
    relevanceRetention: number;
    completenessRetention: number;
    criticalInfoPreserved: boolean;
    recentInfoPreserved: boolean;
  };
  processingTime: number;
  recommendations: string[];
  appliedOptimizations: AppliedOptimization[];
}

export interface AppliedOptimization {
  type: 'compression' | 'filtering' | 'summarization' | 'reordering' | 'deduplication';
  description: string;
  tokensAffected: number;
  qualityImpact: number;
  metadata: Record<string, any>;
}

export interface TokenBudgetAllocation {
  category: string;
  allocated: number;
  used: number;
  remaining: number;
  priority: number;
  isFlexible: boolean;
}

export interface RelevanceScoringResult {
  itemId: string;
  itemType: 'conversation' | 'knowledge' | 'profile' | 'external' | 'system';
  relevanceScore: number;
  factors: RelevanceFactor[];
  finalScore: number;
  reason: string;
}

export interface RelevanceFactor {
  factor: 'recency' | 'quality' | 'relevance' | 'importance' | 'frequency' | 'connection';
  weight: number;
  score: number;
  explanation: string;
}

export interface CompressionStrategy {
  type: 'lossless' | 'lossy' | 'semantic' | 'structural';
  level: CompressionLevel;
  preserveStructure: boolean;
  preserveKeyInfo: boolean;
  targetReduction: number;
}

export interface DynamicAdjustmentRequest {
  currentTokens: number;
  targetTokens: number;
  timeConstraint: number; // milliseconds
  qualityRequirement: number; // 0-1
  contextType: ContextLevel;
  availableStrategies: OptimizationStrategy[];
}

export interface DynamicAdjustmentResult {
  adjustedTokens: number;
  strategy: OptimizationStrategy;
  confidence: number;
  estimatedQuality: number;
  processingTime: number;
  fallbackUsed: boolean;
}

export class ContextOptimizer {
  private static readonly DEFAULT_TOKEN_LIMITS = {
    light: 500,
    recent: 1500,
    selective: 3000,
    full: 8000
  };

  private static readonly RELEVANCE_WEIGHTS = {
    recency: 0.25,
    quality: 0.25,
    relevance: 0.20,
    importance: 0.15,
    frequency: 0.10,
    connection: 0.05
  };

  private static readonly QUALITY_THRESHOLDS = {
    critical: 0.9,
    important: 0.7,
    contextual: 0.5,
    supplementary: 0.3
  };

  private cryptoKey: string;
  private optimizationCache: Map<string, { result: ContextOptimizationResult; timestamp: Date; expiresAt: Date }> = new Map();
  private tokenCounters: Map<string, number> = new Map();
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cryptoKey = process.env.CONTEXT_OPTIMIZER_KEY || 'default-optimizer-key';
    this.startCacheCleanup();
  }

  /**
   * Main optimization method
   */
  async optimizeContext(request: ContextOptimizationRequest): Promise<ContextOptimizationResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Context optimization started', {
        componentName: 'ContextOptimizer',
        userId: request.userId,
        targetLevel: request.targetLevel,
        maxTokens: request.maxTokens,
        optimizationStrategy: request.optimizationStrategy
      });

      // Calculate current token usage
      const currentTokens = this.countTotalTokens(request.originalContext);
      
      if (currentTokens <= request.maxTokens) {
        logInfo('No optimization needed - within token limit', {
          componentName: 'ContextOptimizer',
          userId: request.userId,
          currentTokens,
          maxTokens: request.maxTokens
        });

        return this.createNoOptimizationResult(request, currentTokens);
      }

      // Apply optimization strategy
      let optimizedContext: OptimizableContext;
      let appliedOptimizations: AppliedOptimization[] = [];

      switch (request.optimizationStrategy) {
        case 'compression':
          const compressionResult = await this.applyCompressionOptimization(request);
          optimizedContext = compressionResult.context;
          appliedOptimizations = compressionResult.optimizations;
          break;
          
        case 'truncation':
          const truncationResult = await this.applyTruncationOptimization(request);
          optimizedContext = truncationResult.context;
          appliedOptimizations = truncationResult.optimizations;
          break;
          
        case 'summarization':
          const summarizationResult = await this.applySummarizationOptimization(request);
          optimizedContext = summarizationResult.context;
          appliedOptimizations = summarizationResult.optimizations;
          break;
          
        case 'relevance_filtering':
          const filteringResult = await this.applyRelevanceFiltering(request);
          optimizedContext = filteringResult.context;
          appliedOptimizations = filteringResult.optimizations;
          break;
          
        case 'hierarchical':
          const hierarchicalResult = await this.applyHierarchicalOptimization(request);
          optimizedContext = hierarchicalResult.context;
          appliedOptimizations = hierarchicalResult.optimizations;
          break;
          
        default:
          throw new Error(`Unknown optimization strategy: ${request.optimizationStrategy}`);
      }

      // Calculate final token count
      const finalTokens = this.countTotalTokens(optimizedContext);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityRetention(
        request.originalContext,
        optimizedContext,
        request
      );

      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(
        request,
        appliedOptimizations,
        qualityMetrics
      );

      const result: ContextOptimizationResult = {
        optimizationId: this.generateOptimizationId(),
        originalContext: request.originalContext,
        optimizedContext,
        optimizationStrategy: request.optimizationStrategy,
        tokenBudgetStrategy: request.tokenBudgetStrategy,
        tokenReduction: {
          original: currentTokens,
          optimized: finalTokens,
          reductionRatio: currentTokens > 0 ? (currentTokens - finalTokens) / currentTokens : 0,
          tokensSaved: currentTokens - finalTokens
        },
        qualityMetrics,
        processingTime: Date.now() - startTime,
        recommendations,
        appliedOptimizations
      };

      // Cache result
      this.cacheOptimizationResult(result);
      
      // Log optimization
      await this.logOptimizationResult(request, result);

      const processingTime = Date.now() - startTime;
      logInfo('Context optimization completed', {
        componentName: 'ContextOptimizer',
        optimizationId: result.optimizationId,
        originalTokens: currentTokens,
        optimizedTokens: finalTokens,
        reductionRatio: result.tokenReduction.reductionRatio,
        processingTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'ContextOptimizer',
        operation: 'optimize_context',
        userId: request.userId,
        optimizationStrategy: request.optimizationStrategy
      });

      throw new Error(`Context optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Manage token budget allocation
   */
  async allocateTokenBudget(
    context: OptimizableContext,
    totalBudget: number,
    strategy: TokenBudgetStrategy = 'adaptive'
  ): Promise<TokenBudgetAllocation[]> {
    const allocations: TokenBudgetAllocation[] = [];

    try {
      logInfo('Token budget allocation started', {
        componentName: 'ContextOptimizer',
        totalBudget,
        strategy
      });

      switch (strategy) {
        case 'strict':
          allocations.push(...this.allocateStrictBudget(context, totalBudget));
          break;
          
        case 'flexible':
          allocations.push(...this.allocateFlexibleBudget(context, totalBudget));
          break;
          
        case 'adaptive':
          allocations.push(...this.allocateAdaptiveBudget(context, totalBudget));
          break;
          
        case 'priority_based':
          allocations.push(...this.allocatePriorityBasedBudget(context, totalBudget));
          break;
          
        default:
          throw new Error(`Unknown token budget strategy: ${strategy}`);
      }

      // Validate allocations
      const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated, 0);
      if (totalAllocated > totalBudget) {
        logWarning('Token budget allocation exceeds total budget', {
          componentName: 'ContextOptimizer',
          totalAllocated,
          totalBudget
        });
      }

      logInfo('Token budget allocation completed', {
        componentName: 'ContextOptimizer',
        totalAllocated,
        totalBudget,
        categories: allocations.length
      });

      return allocations;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'ContextOptimizer',
        operation: 'allocate_token_budget',
        strategy
      });

      return this.createDefaultAllocations(context, totalBudget);
    }
  }

  /**
   * Calculate relevance scores for context items
   */
  async calculateRelevanceScores(
    context: OptimizableContext,
    userId: string,
    currentQuery?: string
  ): Promise<RelevanceScoringResult[]> {
    const results: RelevanceScoringResult[] = [];

    try {
      logInfo('Relevance scoring started', {
        componentName: 'ContextOptimizer',
        userId,
        hasQuery: !!currentQuery
      });

      // Score conversation history
      if (context.conversationHistory) {
        for (const conv of context.conversationHistory) {
          const result = this.scoreConversationRelevance(conv, currentQuery, userId);
          results.push(result);
        }
      }

      // Score knowledge base
      if (context.knowledgeBase) {
        for (const kb of context.knowledgeBase) {
          const result = this.scoreKnowledgeRelevance(kb, currentQuery, userId);
          results.push(result);
        }
      }

      // Score user profile
      if (context.userProfile) {
        const result = this.scoreProfileRelevance(context.userProfile, currentQuery, userId);
        results.push(result);
      }

      // Score external sources
      if (context.externalSources) {
        for (const ext of context.externalSources) {
          const result = this.scoreExternalRelevance(ext, currentQuery, userId);
          results.push(result);
        }
      }

      // Score system context
      if (context.systemContext) {
        const result = this.scoreSystemRelevance(context.systemContext, currentQuery, userId);
        results.push(result);
      }

      // Sort by final score
      results.sort((a, b) => b.finalScore - a.finalScore);

      logInfo('Relevance scoring completed', {
        componentName: 'ContextOptimizer',
        userId,
        scoredItems: results.length,
        averageScore: results.reduce((sum, r) => sum + r.finalScore, 0) / results.length
      });

      return results;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'ContextOptimizer',
        operation: 'calculate_relevance_scores',
        userId
      });

      return [];
    }
  }

  /**
   * Apply dynamic context adjustment based on changing requirements
   */
  async adjustContextDynamically(
    request: DynamicAdjustmentRequest
  ): Promise<DynamicAdjustmentResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Dynamic context adjustment started', {
        componentName: 'ContextOptimizer',
        currentTokens: request.currentTokens,
        targetTokens: request.targetTokens,
        timeConstraint: request.timeConstraint
      });

      let adjustedTokens = request.currentTokens;
      let strategy: OptimizationStrategy = request.availableStrategies[0];
      let confidence = 0.5;
      let estimatedQuality = 0.8;
      let fallbackUsed = false;

      // Calculate adjustment needed
      const adjustmentNeeded = request.currentTokens - request.targetTokens;
      
      if (adjustmentNeeded <= 0) {
        // No reduction needed
        return {
          adjustedTokens: request.currentTokens,
          strategy: 'relevance_filtering',
          confidence: 1.0,
          estimatedQuality: 0.9,
          processingTime: Date.now() - startTime,
          fallbackUsed: false
        };
      }

      // Select best strategy based on constraints
      const strategyPerformance = this.evaluateStrategyPerformance(
        request.availableStrategies,
        adjustmentNeeded,
        request.qualityRequirement,
        request.timeConstraint
      );

      if (strategyPerformance.bestStrategy) {
        strategy = strategyPerformance.bestStrategy;
        confidence = strategyPerformance.confidence;
        estimatedQuality = strategyPerformance.estimatedQuality;
      } else {
        // Fallback to most reliable strategy
        strategy = 'relevance_filtering';
        confidence = 0.3;
        estimatedQuality = 0.6;
        fallbackUsed = true;
      }

      // Estimate token reduction
      const estimatedReduction = this.estimateTokenReduction(strategy, request.currentTokens, request.qualityRequirement);
      adjustedTokens = Math.max(request.targetTokens, request.currentTokens - estimatedReduction);

      const result: DynamicAdjustmentResult = {
        adjustedTokens,
        strategy,
        confidence,
        estimatedQuality,
        processingTime: Date.now() - startTime,
        fallbackUsed
      };

      logInfo('Dynamic context adjustment completed', {
        componentName: 'ContextOptimizer',
        originalTokens: request.currentTokens,
        adjustedTokens,
        strategy,
        confidence,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'ContextOptimizer',
        operation: 'adjust_context_dynamically'
      });

      return {
        adjustedTokens: request.currentTokens,
        strategy: 'relevance_filtering',
        confidence: 0.0,
        estimatedQuality: 0.0,
        processingTime: Date.now() - startTime,
        fallbackUsed: true
      };
    }
  }

  /**
   * Private helper methods
   */

  private countTotalTokens(context: OptimizableContext): number {
    let total = 0;

    if (context.userProfile?.totalTokens) total += context.userProfile.totalTokens;
    if (context.conversationHistory) {
      total += context.conversationHistory.reduce((sum, conv) => sum + conv.tokenCount, 0);
    }
    if (context.knowledgeBase) {
      total += context.knowledgeBase.reduce((sum, kb) => sum + kb.tokenCount, 0);
    }
    if (context.externalSources) {
      total += context.externalSources.reduce((sum, ext) => sum + ext.tokenCount, 0);
    }
    if (context.systemContext?.tokenCount) total += context.systemContext.tokenCount;

    return total;
  }

  private createNoOptimizationResult(
    request: ContextOptimizationRequest,
    currentTokens: number
  ): ContextOptimizationResult {
    return {
      optimizationId: this.generateOptimizationId(),
      originalContext: request.originalContext,
      optimizedContext: request.originalContext,
      optimizationStrategy: request.optimizationStrategy,
      tokenBudgetStrategy: request.tokenBudgetStrategy,
      tokenReduction: {
        original: currentTokens,
        optimized: currentTokens,
        reductionRatio: 0,
        tokensSaved: 0
      },
      qualityMetrics: {
        relevanceRetention: 1.0,
        completenessRetention: 1.0,
        criticalInfoPreserved: true,
        recentInfoPreserved: true
      },
      processingTime: 0,
      recommendations: ['No optimization needed - context within token limits'],
      appliedOptimizations: []
    };
  }

  private async applyCompressionOptimization(request: ContextOptimizationRequest): Promise<{context: OptimizableContext, optimizations: AppliedOptimization[]}> {
    const context = JSON.parse(JSON.stringify(request.originalContext)); // Deep clone
    const optimizations: AppliedOptimization[] = [];

    // Compress conversation history
    if (context.conversationHistory && request.maxTokens < this.countTotalTokens(context)) {
      const compressionResult = this.compressConversationHistory(context.conversationHistory, request);
      context.conversationHistory = compressionResult.compressed;
      optimizations.push(...compressionResult.optimizations);
    }

    // Compress knowledge base
    if (context.knowledgeBase && request.maxTokens < this.countTotalTokens(context)) {
      const compressionResult = this.compressKnowledgeBase(context.knowledgeBase, request);
      context.knowledgeBase = compressionResult.compressed;
      optimizations.push(...compressionResult.optimizations);
    }

    // Compress user profile if needed
    if (context.userProfile && request.maxTokens < this.countTotalTokens(context)) {
      const compressionResult = this.compressUserProfile(context.userProfile, request);
      context.userProfile = compressionResult.compressed;
      optimizations.push(...compressionResult.optimizations);
    }

    return { context, optimizations };
  }

  private async applyTruncationOptimization(request: ContextOptimizationRequest): Promise<{context: OptimizableContext, optimizations: AppliedOptimization[]}> {
    const context = JSON.parse(JSON.stringify(request.originalContext));
    const optimizations: AppliedOptimization[] = [];
    let remainingBudget = request.maxTokens;

    // Prioritize by relevance and importance
    const prioritizedItems = this.prioritizeContextItems(context, request);

    // Start with lowest priority items
    for (const item of prioritizedItems.reverse()) {
      if (remainingBudget >= request.maxTokens) break;

      switch (item.type) {
        case 'conversation':
          const truncated = this.truncateConversationItems(context.conversationHistory!, item.ids, remainingBudget);
          context.conversationHistory = truncated.remaining;
          remainingBudget = truncated.remainingBudget;
          optimizations.push(...truncated.optimizations);
          break;

        case 'knowledge':
          const knowledgeTruncated = this.truncateKnowledgeItems(context.knowledgeBase!, item.ids, remainingBudget);
          context.knowledgeBase = knowledgeTruncated.remaining;
          remainingBudget = knowledgeTruncated.remainingBudget;
          optimizations.push(...knowledgeTruncated.optimizations);
          break;

        case 'external':
          const externalTruncated = this.truncateExternalItems(context.externalSources!, item.ids, remainingBudget);
          context.externalSources = externalTruncated.remaining;
          remainingBudget = externalTruncated.remainingBudget;
          optimizations.push(...externalTruncated.optimizations);
          break;
      }
    }

    return { context, optimizations };
  }

  private async applySummarizationOptimization(request: ContextOptimizationRequest): Promise<{context: OptimizableContext, optimizations: AppliedOptimization[]}> {
    const context = JSON.parse(JSON.stringify(request.originalContext));
    const optimizations: AppliedOptimization[] = [];

    // Summarize conversation history
    if (context.conversationHistory) {
      const summaryResult = this.summarizeConversationHistory(context.conversationHistory, request);
      context.conversationHistory = summaryResult.summarized;
      optimizations.push(...summaryResult.optimizations);
    }

    // Summarize knowledge base
    if (context.knowledgeBase) {
      const summaryResult = this.summarizeKnowledgeBase(context.knowledgeBase, request);
      context.knowledgeBase = summaryResult.summarized;
      optimizations.push(...summaryResult.optimizations);
    }

    return { context, optimizations };
  }

  private async applyRelevanceFiltering(request: ContextOptimizationRequest): Promise<{context: OptimizableContext, optimizations: AppliedOptimization[]}> {
    const context = JSON.parse(JSON.stringify(request.originalContext));
    const optimizations: AppliedOptimization[] = [];

    // Calculate relevance scores
    const relevanceResults = await this.calculateRelevanceScores(context, request.userId);

    // Filter conversation history
    if (context.conversationHistory) {
      const filtered = this.filterByRelevance(
        context.conversationHistory,
        relevanceResults.filter(r => r.itemType === 'conversation'),
        request.relevanceThreshold || 0.5
      );
      context.conversationHistory = filtered.filtered;
      optimizations.push(...filtered.optimizations);
    }

    // Filter knowledge base
    if (context.knowledgeBase) {
      const filtered = this.filterByRelevance(
        context.knowledgeBase,
        relevanceResults.filter(r => r.itemType === 'knowledge'),
        request.relevanceThreshold || 0.5
      );
      context.knowledgeBase = filtered.filtered;
      optimizations.push(...filtered.optimizations);
    }

    return { context, optimizations };
  }

  private async applyHierarchicalOptimization(request: ContextOptimizationRequest): Promise<{context: OptimizableContext, optimizations: AppliedOptimization[]}> {
    const context = JSON.parse(JSON.stringify(request.originalContext));
    const optimizations: AppliedOptimization[] = [];

    // Define hierarchy levels
    const hierarchy = this.defineContextHierarchy(request);

    // Apply optimization level by level
    for (const level of hierarchy.levels) {
      if (this.countTotalTokens(context) <= request.maxTokens) break;

      switch (level.action) {
        case 'preserve':
          // Keep as is
          break;
        case 'compress':
          const compressionResult = this.compressContextLevel(context, level, request);
          optimizations.push(...compressionResult.optimizations);
          break;
        case 'summarize':
          const summaryResult = this.summarizeContextLevel(context, level, request);
          optimizations.push(...summaryResult.optimizations);
          break;
        case 'remove':
          const removalResult = this.removeContextLevel(context, level, request);
          optimizations.push(...removalResult.optimizations);
          break;
      }
    }

    return { context, optimizations };
  }

  // Optimization strategy implementations
  private compressConversationHistory(conversations: ConversationContext[], request: ContextOptimizationRequest): {compressed: ConversationContext[], optimizations: AppliedOptimization[]} {
    const compressed = [...conversations];
    const optimizations: AppliedOptimization[] = [];
    let tokensSaved = 0;

    for (let i = 0; i < compressed.length; i++) {
      const conv = compressed[i];
      const originalLength = conv.content.length;
      
      // Apply compression based on level
      let compressedContent = conv.content;
      switch (request.compressionLevel) {
        case 'low':
          compressedContent = this.lightCompression(conv.content);
          break;
        case 'medium':
          compressedContent = this.mediumCompression(conv.content);
          break;
        case 'high':
          compressedContent = this.highCompression(conv.content);
          break;
        case 'aggressive':
          compressedContent = this.aggressiveCompression(conv.content);
          break;
      }

      if (compressedContent !== conv.content) {
        const saved = originalLength - compressedContent.length;
        compressed[i] = { ...conv, content: compressedContent };
        tokensSaved += saved;
      }
    }

    optimizations.push({
      type: 'compression',
      description: `Compressed conversation history (${request.compressionLevel} level)`,
      tokensAffected: tokensSaved,
      qualityImpact: this.calculateCompressionQualityImpact(request.compressionLevel || 'medium'),
      metadata: { compressionLevel: request.compressionLevel, itemsCompressed: compressed.length }
    });

    return { compressed, optimizations };
  }

  private compressKnowledgeBase(knowledge: KnowledgeContext[], request: ContextOptimizationRequest): {compressed: KnowledgeContext[], optimizations: AppliedOptimization[]} {
    const compressed = [...knowledge];
    const optimizations: AppliedOptimization[] = [];
    let tokensSaved = 0;

    for (let i = 0; i < compressed.length; i++) {
      const kb = compressed[i];
      const originalLength = kb.content.length;
      
      let compressedContent = kb.content;
      
      // Prioritize high-reliability sources for less compression
      if (kb.reliability > 0.8) {
        compressedContent = this.lightCompression(kb.content);
      } else {
        compressedContent = this.mediumCompression(kb.content);
      }

      if (compressedContent !== kb.content) {
        const saved = originalLength - compressedContent.length;
        compressed[i] = { ...kb, content: compressedContent };
        tokensSaved += saved;
      }
    }

    optimizations.push({
      type: 'compression',
      description: 'Compressed knowledge base content',
      tokensAffected: tokensSaved,
      qualityImpact: 0.1,
      metadata: { itemsCompressed: compressed.length, averageReliability: knowledge.reduce((sum, k) => sum + k.reliability, 0) / knowledge.length }
    });

    return { compressed, optimizations };
  }

  private compressUserProfile(profile: UserProfileContext, request: ContextOptimizationRequest): {compressed: UserProfileContext, optimizations: AppliedOptimization[]} {
    const compressed = { ...profile };
    const optimizations: AppliedOptimization[] = [];
    let tokensSaved = 0;

    // Compress lists while preserving key information
    if (compressed.subjects.length > 5) {
      compressed.subjects = compressed.subjects.slice(0, 5);
      tokensSaved += 50; // Estimated savings
    }

    if (compressed.strengths.length > 3) {
      compressed.strengths = compressed.strengths.slice(0, 3);
      tokensSaved += 30;
    }

    if (compressed.weaknesses.length > 3) {
      compressed.weaknesses = compressed.weaknesses.slice(0, 3);
      tokensSaved += 30;
    }

    optimizations.push({
      type: 'compression',
      description: 'Compressed user profile lists',
      tokensAffected: tokensSaved,
      qualityImpact: 0.05,
      metadata: { subjectsKept: compressed.subjects.length, strengthsKept: compressed.strengths.length, weaknessesKept: compressed.weaknesses.length }
    });

    return { compressed, optimizations };
  }

  private lightCompression(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private mediumCompression(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/\b(very|really|quite|pretty)\s+/gi, '')
      .replace(/\b(okay|ok|alright)\b/gi, 'ok')
      .trim();
  }

  private highCompression(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/\b(very|really|quite|pretty|extremely|highly)\s+/gi, '')
      .replace(/\b(okay|ok|alright|somewhat)\b/gi, 'ok')
      .replace(/[,;]\s*[a-zA-Z]+$/g, '') // Remove trailing words after punctuation
      .trim();
  }

  private aggressiveCompression(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\b(very|really|quite|pretty|extremely|highly|absolutely|definitely)\s+/gi, '')
      .replace(/\b(okay|ok|alright|somewhat|maybe|perhaps)\b/gi, 'ok')
      .replace(/[,;]\s*[a-zA-Z]+$/g, '')
      .replace(/\b(the|a|an)\b\s+/gi, '')
      .trim();
  }

  private calculateCompressionQualityImpact(level: CompressionLevel): number {
    const impacts = {
      low: 0.02,
      medium: 0.05,
      high: 0.1,
      aggressive: 0.2
    };
    return impacts[level] || 0.05;
  }

  private prioritizeContextItems(context: OptimizableContext, request: ContextOptimizationRequest): Array<{type: string, ids: string[], priority: number}> {
    const items: Array<{type: string, ids: string[], priority: number}> = [];

    // Add conversation history
    if (context.conversationHistory) {
      const sorted = context.conversationHistory
        .sort((a, b) => this.calculateItemPriority(b, request) - this.calculateItemPriority(a, request))
        .map(conv => conv.id);
      items.push({ type: 'conversation', ids: sorted, priority: this.calculateItemPriority({ contextValue: 'contextual' } as any, request) });
    }

    // Add knowledge base
    if (context.knowledgeBase) {
      const sorted = context.knowledgeBase
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(kb => kb.id);
      items.push({ type: 'knowledge', ids: sorted, priority: 0.6 });
    }

    // Add external sources
    if (context.externalSources) {
      const sorted = context.externalSources
        .sort((a, b) => b.reliability - a.reliability)
        .map(ext => ext.source);
      items.push({ type: 'external', ids: sorted, priority: 0.4 });
    }

    return items.sort((a, b) => a.priority - b.priority); // Lowest priority first
  }

  private calculateItemPriority(item: any, request: ContextOptimizationRequest): number {
    let priority = 0.5; // Base priority

    // Context value priority
    const valuePriorities = {
      'critical': 1.0,
      'important': 0.8,
      'contextual': 0.6,
      'supplementary': 0.4
    };
    priority *= valuePriorities[item.contextValue] || 0.6;

    // Recent items get higher priority
    if (item.timestamp) {
      const ageInHours = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0.1, 1 - (ageInHours / 24)); // Decay over 24 hours
      priority *= recencyFactor;
    }

    // Quality score priority
    if (item.qualityScore) {
      priority *= item.qualityScore;
    }

    // Preserve critical and recent if requested
    if (request.preserveCritical && item.contextValue === 'critical') {
      priority *= 2;
    }

    if (request.preserveRecent && item.timestamp) {
      const ageInHours = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
      if (ageInHours < 2) { // Recent (2 hours)
        priority *= 1.5;
      }
    }

    return Math.min(1.0, priority);
  }

  private truncateConversationItems(conversations: ConversationContext[], ids: string[], remainingBudget: number): {remaining: ConversationContext[], remainingBudget: number, optimizations: AppliedOptimization[]} {
    const remaining = conversations.filter(conv => !ids.includes(conv.id));
    const removed = conversations.length - remaining.length;
    const tokensSaved = conversations
      .filter(conv => ids.includes(conv.id))
      .reduce((sum, conv) => sum + conv.tokenCount, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'truncation',
      description: `Removed ${removed} low-priority conversation items`,
      tokensAffected: tokensSaved,
      qualityImpact: 0.15,
      metadata: { itemsRemoved: removed, selectionCriteria: 'priority' }
    }];

    return { remaining, remainingBudget: remainingBudget + tokensSaved, optimizations };
  }

  private truncateKnowledgeItems(knowledge: KnowledgeContext[], ids: string[], remainingBudget: number): {remaining: KnowledgeContext[], remainingBudget: number, optimizations: AppliedOptimization[]} {
    const remaining = knowledge.filter(kb => !ids.includes(kb.id));
    const removed = knowledge.length - remaining.length;
    const tokensSaved = knowledge
      .filter(kb => ids.includes(kb.id))
      .reduce((sum, kb) => sum + kb.tokenCount, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'truncation',
      description: `Removed ${removed} low-relevance knowledge items`,
      tokensAffected: tokensSaved,
      qualityImpact: 0.1,
      metadata: { itemsRemoved: removed, selectionCriteria: 'relevance' }
    }];

    return { remaining, remainingBudget: remainingBudget + tokensSaved, optimizations };
  }

  private truncateExternalItems(external: ExternalContext[], ids: string[], remainingBudget: number): {remaining: ExternalContext[], remainingBudget: number, optimizations: AppliedOptimization[]} {
    const remaining = external.filter(ext => !ids.includes(ext.source));
    const removed = external.length - remaining.length;
    const tokensSaved = external
      .filter(ext => ids.includes(ext.source))
      .reduce((sum, ext) => sum + ext.tokenCount, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'truncation',
      description: `Removed ${removed} low-priority external sources`,
      tokensAffected: tokensSaved,
      qualityImpact: 0.05,
      metadata: { itemsRemoved: removed, selectionCriteria: 'priority' }
    }];

    return { remaining, remainingBudget: remainingBudget + tokensSaved, optimizations };
  }

  private summarizeConversationHistory(conversations: ConversationContext[], request: ContextOptimizationRequest): {summarized: ConversationContext[], optimizations: AppliedOptimization[]} {
    const summarized = conversations.map(conv => {
      const summary = this.createConversationSummary(conv);
      return { ...conv, content: summary, tokenCount: Math.ceil(summary.length / 4) }; // Rough token estimation
    });

    const tokensSaved = conversations.reduce((sum, conv) => sum + conv.tokenCount, 0) - 
                      summarized.reduce((sum, conv) => sum + conv.tokenCount, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'summarization',
      description: 'Summarized conversation history',
      tokensAffected: tokensSaved,
      qualityImpact: 0.08,
      metadata: { itemsSummarized: summarized.length, method: 'key_point_extraction' }
    }];

    return { summarized, optimizations };
  }

  private createConversationSummary(conv: ConversationContext): string {
    // Simple extractive summarization - extract first and last sentences, key points
    const sentences = conv.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) return conv.content;
    
    const firstSentence = sentences[0].trim();
    const lastSentence = sentences[sentences.length - 1].trim();
    const keyPoints = sentences.slice(1, -1).filter(s => 
      s.toLowerCase().includes('important') || 
      s.toLowerCase().includes('key') || 
      s.toLowerCase().includes('note')
    );
    
    return [firstSentence, ...keyPoints.slice(0, 2), lastSentence].join('. ') + '.';
  }

  private summarizeKnowledgeBase(knowledge: KnowledgeContext[], request: ContextOptimizationRequest): {summarized: KnowledgeContext[], optimizations: AppliedOptimization[]} {
    const summarized = knowledge.map(kb => {
      const summary = this.createKnowledgeSummary(kb);
      return { ...kb, content: summary, tokenCount: Math.ceil(summary.length / 4) };
    });

    const tokensSaved = knowledge.reduce((sum, kb) => sum + kb.tokenCount, 0) - 
                      summarized.reduce((sum, kb) => sum + kb.tokenCount, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'summarization',
      description: 'Summarized knowledge base content',
      tokensAffected: tokensSaved,
      qualityImpact: 0.12,
      metadata: { itemsSummarized: summarized.length, method: 'content_abstraction' }
    }];

    return { summarized, optimizations };
  }

  private createKnowledgeSummary(kb: KnowledgeContext): string {
    // Extract key facts and definitions
    const sentences = kb.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    if (sentences.length === 1) return sentences[0].trim();
    
    // Prioritize sentences with key terms
    const keyTerms = ['definition', 'definition:', 'is', 'are', 'means', 'refers to', 'defined as'];
    const prioritySentences = sentences.filter(s => 
      keyTerms.some(term => s.toLowerCase().includes(term))
    );
    
    if (prioritySentences.length > 0) {
      return prioritySentences[0].trim();
    }
    
    return sentences[0].trim(); // Fallback to first sentence
  }

  private filterByRelevance<T extends { id: string; relevanceScore?: number; qualityScore?: number }>(
    items: T[],
    relevanceResults: RelevanceScoringResult[],
    threshold: number
  ): {filtered: T[], optimizations: AppliedOptimization[]} {
    const thresholdResults = relevanceResults.filter(r => r.finalScore >= threshold);
    const filteredIds = new Set(thresholdResults.map(r => r.itemId));
    
    const filtered = items.filter(item => filteredIds.has(item.id));
    const removed = items.length - filtered.length;
    const tokensAffected = items
      .filter(item => !filteredIds.has(item.id))
      .reduce((sum, item) => sum + (item as any).tokenCount || 0, 0);

    const optimizations: AppliedOptimization[] = [{
      type: 'filtering',
      description: `Filtered ${removed} low-relevance items (threshold: ${threshold})`,
      tokensAffected,
      qualityImpact: 0.05,
      metadata: { itemsRemoved: removed, threshold, averageScore: thresholdResults.reduce((sum, r) => sum + r.finalScore, 0) / thresholdResults.length }
    }];

    return { filtered, optimizations };
  }

  private defineContextHierarchy(request: ContextOptimizationRequest): {levels: Array<{name: string, action: 'preserve' | 'compress' | 'summarize' | 'remove', criteria: any}>} {
    return {
      levels: [
        { name: 'critical', action: 'preserve', criteria: { contextValue: 'critical', qualityScore: 0.9 } },
        { name: 'recent_important', action: 'preserve', criteria: { recency: '2_hours', contextValue: 'important' } },
        { name: 'user_profile', action: 'compress', criteria: { type: 'profile' } },
        { name: 'conversation_recent', action: 'summarize', criteria: { type: 'conversation', recency: '1_day' } },
        { name: 'knowledge_high_rel', action: 'compress', criteria: { type: 'knowledge', reliability: 0.8 } },
        { name: 'conversation_old', action: 'remove', criteria: { type: 'conversation', recency: '1_week' } },
        { name: 'knowledge_low_rel', action: 'remove', criteria: { type: 'knowledge', reliability: 0.5 } },
        { name: 'external_low_val', action: 'remove', criteria: { type: 'external', contextValue: 'supplementary' } }
      ]
    };
  }

  private compressContextLevel(context: OptimizableContext, level: any, request: ContextOptimizationRequest): {context: OptimizableContext, optimizations: AppliedOptimization[]} {
    // Implementation for compressing specific context levels
    return { context, optimizations: [] };
  }

  private summarizeContextLevel(context: OptimizableContext, level: any, request: ContextOptimizationRequest): {context: OptimizableContext, optimizations: AppliedOptimization[]} {
    // Implementation for summarizing specific context levels
    return { context, optimizations: [] };
  }

  private removeContextLevel(context: OptimizableContext, level: any, request: ContextOptimizationRequest): {context: OptimizableContext, optimizations: AppliedOptimization[]} {
    // Implementation for removing specific context levels
    return { context, optimizations: [] };
  }

  // Relevance scoring implementations
  private scoreConversationRelevance(conv: ConversationContext, query?: string, userId?: string): RelevanceScoringResult {
    const factors: RelevanceFactor[] = [];
    let finalScore = 0.5;

    // Recency factor
    const hoursAgo = (Date.now() - conv.timestamp.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0.1, 1 - (hoursAgo / 24));
    factors.push({
      factor: 'recency',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.recency,
      score: recencyScore,
      explanation: `Conversation from ${hoursAgo.toFixed(1)} hours ago`
    });

    // Quality factor
    const qualityScore = conv.qualityScore || 0.5;
    factors.push({
      factor: 'quality',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.quality,
      score: qualityScore,
      explanation: `Quality score: ${qualityScore.toFixed(2)}`
    });

    // Relevance to query
    if (query) {
      const queryRelevance = this.calculateTextRelevance(conv.content, query);
      factors.push({
        factor: 'relevance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance,
        score: queryRelevance,
        explanation: `Query relevance: ${queryRelevance.toFixed(2)}`
      });
    } else {
      const defaultRelevance = 0.5;
      factors.push({
        factor: 'relevance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance,
        score: defaultRelevance,
        explanation: 'Default relevance (no query provided)'
      });
    }

    // Importance factor
    const importanceScores = { 'critical': 1.0, 'important': 0.8, 'contextual': 0.6, 'supplementary': 0.4 };
    const importanceScore = importanceScores[conv.contextValue] || 0.6;
    factors.push({
      factor: 'importance',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.importance,
      score: importanceScore,
      explanation: `Importance level: ${conv.contextValue}`
    });

    // Calculate final score
    for (const factor of factors) {
      finalScore += factor.weight * factor.score;
    }
    finalScore = Math.min(1.0, Math.max(0.0, finalScore));

    return {
      itemId: conv.id,
      itemType: 'conversation',
      relevanceScore: conv.relevanceScore || 0.5,
      factors,
      finalScore,
      reason: `Conversation relevance based on ${factors.length} factors`
    };
  }

  private scoreKnowledgeRelevance(kb: KnowledgeContext, query?: string, userId?: string): RelevanceScoringResult {
    const factors: RelevanceFactor[] = [];
    let finalScore = 0.5;

    // Reliability factor
    factors.push({
      factor: 'quality',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.quality,
      score: kb.reliability,
      explanation: `Source reliability: ${kb.reliability.toFixed(2)}`
    });

    // Relevance to query
    if (query) {
      const queryRelevance = this.calculateTextRelevance(kb.content, query);
      factors.push({
        factor: 'relevance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance,
        score: queryRelevance,
        explanation: `Query relevance: ${queryRelevance.toFixed(2)}`
      });
    } else {
      const defaultRelevance = 0.5;
      factors.push({
        factor: 'relevance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance,
        score: defaultRelevance,
        explanation: 'Default relevance (no query provided)'
      });
    }

    // Knowledge base relevance
    factors.push({
      factor: 'relevance',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance * 0.5,
      score: kb.relevanceScore,
      explanation: `Pre-calculated relevance: ${kb.relevanceScore.toFixed(2)}`
    });

    // Verification status
    const verificationScore = kb.verificationStatus === 'verified' ? 1.0 : 
                              kb.verificationStatus === 'pending' ? 0.6 : 0.3;
    factors.push({
      factor: 'quality',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.quality * 0.5,
      score: verificationScore,
      explanation: `Verification status: ${kb.verificationStatus}`
    });

    // Calculate final score
    for (const factor of factors) {
      finalScore += factor.weight * factor.score;
    }
    finalScore = Math.min(1.0, Math.max(0.0, finalScore));

    return {
      itemId: kb.id,
      itemType: 'knowledge',
      relevanceScore: kb.relevanceScore,
      factors,
      finalScore,
      reason: `Knowledge relevance based on ${factors.length} factors`
    };
  }

  private scoreProfileRelevance(profile: UserProfileContext, query?: string, userId?: string): RelevanceScoringResult {
    const factors: RelevanceFactor[] = [];
    let finalScore = 0.7; // Base score for profile

    // Query relevance to subjects
    if (query) {
      const subjectRelevance = this.calculateListRelevance(profile.subjects, query);
      factors.push({
        factor: 'relevance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.relevance,
        score: subjectRelevance,
        explanation: `Subject relevance: ${subjectRelevance.toFixed(2)}`
      });
    }

    // Learning style match
    factors.push({
      factor: 'importance',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.importance,
      score: 0.8,
      explanation: 'User profile always important'
    });

    // Calculate final score
    for (const factor of factors) {
      finalScore += factor.weight * factor.score;
    }
    finalScore = Math.min(1.0, Math.max(0.0, finalScore));

    return {
      itemId: profile.id,
      itemType: 'profile',
      relevanceScore: 0.8,
      factors,
      finalScore,
      reason: 'User profile relevance'
    };
  }

  private scoreExternalRelevance(ext: ExternalContext, query?: string, userId?: string): RelevanceScoringResult {
    const factors: RelevanceFactor[] = [];
    let finalScore = 0.6; // Base score for external sources

    // Reliability factor
    factors.push({
      factor: 'quality',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.quality,
      score: ext.reliability,
      explanation: `External source reliability: ${ext.reliability.toFixed(2)}`
    });

    // Context value
    const valueScores = { 'critical': 1.0, 'important': 0.8, 'contextual': 0.6 };
    const valueScore = valueScores[ext.contextValue] || 0.6;
    factors.push({
      factor: 'importance',
      weight: ContextOptimizer.RELEVANCE_WEIGHTS.importance,
      score: valueScore,
      explanation: `Context value: ${ext.contextValue}`
    });

    // Calculate final score
    for (const factor of factors) {
      finalScore += factor.weight * factor.score;
    }
    finalScore = Math.min(1.0, Math.max(0.0, finalScore));

    return {
      itemId: ext.source,
      itemType: 'external',
      relevanceScore: 0.6,
      factors,
      finalScore,
      reason: `External source relevance based on ${factors.length} factors`
    };
  }

  private scoreSystemRelevance(system: SystemContext, query?: string, userId?: string): RelevanceScoringResult {
    const factors: RelevanceFactor[] = [];
    let finalScore = 0.5; // Base score for system context

    // System status importance
    if (system.systemStatus.status !== 'operational') {
      factors.push({
        factor: 'importance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.importance,
        score: 0.9,
        explanation: 'Non-operational system status requires attention'
      });
      finalScore = 0.8;
    } else {
      factors.push({
        factor: 'importance',
        weight: ContextOptimizer.RELEVANCE_WEIGHTS.importance,
        score: 0.6,
        explanation: 'System operational'
      });
    }

    return {
      itemId: 'system_context',
      itemType: 'system',
      relevanceScore: 0.5,
      factors,
      finalScore,
      reason: 'System context relevance'
    };
  }

  // Utility methods
  private calculateTextRelevance(text: string, query: string): number {
    const textWords = new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    if (queryWords.length === 0) return 0.5;
    
    const matches = queryWords.filter(word => textWords.has(word)).length;
    return matches / queryWords.length;
  }

  private calculateListRelevance(list: string[], query: string): number {
    if (list.length === 0) return 0;
    
    const matches = list.filter(item => 
      item.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(item.toLowerCase())
    ).length;
    
    return matches / list.length;
  }

  // Token budget allocation methods
  private allocateStrictBudget(context: OptimizableContext, totalBudget: number): TokenBudgetAllocation[] {
    const allocations: TokenBudgetAllocation[] = [];

    // Fixed allocation percentages
    const allocations_pct = {
      userProfile: 0.15,
      conversation: 0.40,
      knowledge: 0.30,
      external: 0.10,
      system: 0.05
    };

    for (const [category, percentage] of Object.entries(allocations_pct)) {
      const allocated = Math.floor(totalBudget * percentage);
      allocations.push({
        category,
        allocated,
        used: 0,
        remaining: allocated,
        priority: this.getCategoryPriority(category),
        isFlexible: false
      });
    }

    return allocations;
  }

  private allocateFlexibleBudget(context: OptimizableContext, totalBudget: number): TokenBudgetAllocation[] {
    const allocations: TokenBudgetAllocation[] = [];
    
    // Start with adaptive allocation
    const baseAllocations = this.allocateAdaptiveBudget(context, totalBudget);
    
    // Mark all as flexible
    return baseAllocations.map(alloc => ({
      ...alloc,
      isFlexible: true
    }));
  }

  private allocateAdaptiveBudget(context: OptimizableContext, totalBudget: number): TokenBudgetAllocation[] {
    const allocations: TokenBudgetAllocation[] = [];
    
    // Calculate actual usage
    const actualUsage = {
      userProfile: context.userProfile?.totalTokens || 0,
      conversation: context.conversationHistory?.reduce((sum, conv) => sum + conv.tokenCount, 0) || 0,
      knowledge: context.knowledgeBase?.reduce((sum, kb) => sum + kb.tokenCount, 0) || 0,
      external: context.externalSources?.reduce((sum, ext) => sum + ext.tokenCount, 0) || 0,
      system: context.systemContext?.tokenCount || 0
    };

    const totalActual = Object.values(actualUsage).reduce((sum, usage) => sum + usage, 0);
    
    // Allocate proportionally to actual usage, but ensure minimums
    for (const [category, usage] of Object.entries(actualUsage)) {
      const proportion = totalActual > 0 ? usage / totalActual : 0.2;
      const allocated = Math.max(Math.floor(totalBudget * Math.max(proportion, 0.1)), 100); // Minimum 100 tokens
      
      allocations.push({
        category,
        allocated,
        used: usage,
        remaining: Math.max(0, allocated - usage),
        priority: this.getCategoryPriority(category),
        isFlexible: proportion < 0.1 // Mark as flexible if below minimum
      });
    }

    return allocations;
  }

  private allocatePriorityBasedBudget(context: OptimizableContext, totalBudget: number): TokenBudgetAllocation[] {
    const allocations: TokenBudgetAllocation[] = [];
    
    // Calculate relevance scores for prioritization
    const relevanceResults = this.calculateRelevanceScores(context, 'system'); // system user for calculation
    
    // Group by category and calculate average relevance
    const categoryRelevance: Record<string, {relevance: number, count: number}> = {};
    
    for (const result of relevanceResults) {
      const category = this.getCategoryFromItemType(result.itemType);
      if (!categoryRelevance[category]) {
        categoryRelevance[category] = { relevance: 0, count: 0 };
      }
      categoryRelevance[category].relevance += result.finalScore;
      categoryRelevance[category].count += 1;
    }

    // Calculate relevance-weighted allocations
    const totalRelevance = Object.values(categoryRelevance).reduce((sum, cat) => sum + (cat.relevance / Math.max(cat.count, 1)), 0);
    
    for (const [category, data] of Object.entries(categoryRelevance)) {
      const avgRelevance = data.relevance / Math.max(data.count, 1);
      const weight = totalRelevance > 0 ? avgRelevance / totalRelevance : 0.2;
      const allocated = Math.floor(totalBudget * weight);
      
      allocations.push({
        category,
        allocated,
        used: 0, // Will be filled by actual usage
        remaining: allocated,
        priority: Math.floor(avgRelevance * 10), // Convert to 1-10 scale
        isFlexible: true
      });
    }

    return allocations;
  }

  private getCategoryPriority(category: string): number {
    const priorities = {
      userProfile: 9,
      conversation: 8,
      knowledge: 7,
      external: 5,
      system: 3
    };
    return priorities[category as keyof typeof priorities] || 5;
  }

  private getCategoryFromItemType(itemType: string): string {
    const mapping = {
      'profile': 'userProfile',
      'conversation': 'conversation',
      'knowledge': 'knowledge',
      'external': 'external',
      'system': 'system'
    };
    return mapping[itemType as keyof typeof mapping] || 'unknown';
  }

  private createDefaultAllocations(context: OptimizableContext, totalBudget: number): TokenBudgetAllocation[] {
    return [
      { category: 'userProfile', allocated: Math.floor(totalBudget * 0.2), used: 0, remaining: Math.floor(totalBudget * 0.2), priority: 8, isFlexible: true },
      { category: 'conversation', allocated: Math.floor(totalBudget * 0.4), used: 0, remaining: Math.floor(totalBudget * 0.4), priority: 7, isFlexible: true },
      { category: 'knowledge', allocated: Math.floor(totalBudget * 0.3), used: 0, remaining: Math.floor(totalBudget * 0.3), priority: 6, isFlexible: true },
      { category: 'external', allocated: Math.floor(totalBudget * 0.1), used: 0, remaining: Math.floor(totalBudget * 0.1), priority: 4, isFlexible: true }
    ];
  }

  // Dynamic adjustment methods
  private evaluateStrategyPerformance(
    strategies: OptimizationStrategy[],
    adjustmentNeeded: number,
    qualityRequirement: number,
    timeConstraint: number
  ): {bestStrategy?: OptimizationStrategy, confidence: number, estimatedQuality: number} {
    // Simple heuristic evaluation
    let bestStrategy: OptimizationStrategy | undefined;
    let bestScore = 0;
    let confidence = 0.5;
    let estimatedQuality = 0.7;

    for (const strategy of strategies) {
      let score = 0;

      // Token reduction capability
      const reductionCapability = this.getStrategyReductionCapability(strategy);
      if (reductionCapability >= adjustmentNeeded) {
        score += 0.4;
      } else {
        score += (reductionCapability / adjustmentNeeded) * 0.4;
      }

      // Quality retention
      const qualityRetention = this.getStrategyQualityRetention(strategy);
      if (qualityRetention >= qualityRequirement) {
        score += 0.3;
      } else {
        score += (qualityRetention / qualityRequirement) * 0.3;
      }

      // Speed (inverse of time constraint)
      const speed = this.getStrategySpeed(strategy);
      if (speed <= timeConstraint) {
        score += 0.3;
      } else {
        score += Math.max(0, (timeConstraint / speed)) * 0.3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
        confidence = Math.min(0.9, score);
        estimatedQuality = qualityRetention;
      }
    }

    return { bestStrategy, confidence, estimatedQuality };
  }

  private getStrategyReductionCapability(strategy: OptimizationStrategy): number {
    const capabilities = {
      'compression': 0.2,
      'truncation': 0.5,
      'summarization': 0.4,
      'relevance_filtering': 0.6,
      'hierarchical': 0.7
    };
    return capabilities[strategy] || 0.3;
  }

  private getStrategyQualityRetention(strategy: OptimizationStrategy): number {
    const retention = {
      'compression': 0.95,
      'truncation': 0.8,
      'summarization': 0.85,
      'relevance_filtering': 0.9,
      'hierarchical': 0.88
    };
    return retention[strategy] || 0.85;
  }

  private getStrategySpeed(strategy: OptimizationStrategy): number {
    const speeds = {
      'compression': 100,
      'truncation': 50,
      'summarization': 200,
      'relevance_filtering': 150,
      'hierarchical': 300
    };
    return speeds[strategy] || 150; // milliseconds
  }

  private estimateTokenReduction(strategy: OptimizationStrategy, currentTokens: number, qualityRequirement: number): number {
    const baseReduction = this.getStrategyReductionCapability(strategy) * currentTokens;
    const qualityAdjustment = qualityRequirement < 0.8 ? 0.8 : 1.0; // Reduce if low quality required
    return Math.floor(baseReduction * qualityAdjustment);
  }

  // Quality retention calculation
  private calculateQualityRetention(
    original: OptimizableContext,
    optimized: OptimizableContext,
    request: ContextOptimizationRequest
  ): ContextOptimizationResult['qualityMetrics'] {
    // Calculate relevance retention
    const originalRelevance = this.calculateContextRelevance(original);
    const optimizedRelevance = this.calculateContextRelevance(optimized);
    const relevanceRetention = originalRelevance > 0 ? optimizedRelevance / originalRelevance : 1.0;

    // Calculate completeness retention
    const originalCompleteness = this.calculateContextCompleteness(original);
    const optimizedCompleteness = this.calculateContextCompleteness(optimized);
    const completenessRetention = originalCompleteness > 0 ? optimizedCompleteness / originalCompleteness : 1.0;

    // Check if critical info is preserved
    const criticalInfoPreserved = this.checkCriticalInfoPreserved(original, optimized);

    // Check if recent info is preserved
    const recentInfoPreserved = this.checkRecentInfoPreserved(original, optimized);

    return {
      relevanceRetention,
      completenessRetention,
      criticalInfoPreserved,
      recentInfoPreserved
    };
  }

  private calculateContextRelevance(context: OptimizableContext): number {
    let totalRelevance = 0;
    let count = 0;

    if (context.conversationHistory) {
      for (const conv of context.conversationHistory) {
        totalRelevance += conv.relevanceScore || 0.5;
        count++;
      }
    }

    if (context.knowledgeBase) {
      for (const kb of context.knowledgeBase) {
        totalRelevance += kb.relevanceScore || 0.5;
        count++;
      }
    }

    return count > 0 ? totalRelevance / count : 0.5;
  }

  private calculateContextCompleteness(context: OptimizableContext): number {
    const originalTotal = this.countTotalTokens(request?.originalContext || context);
    const currentTotal = this.countTotalTokens(context);
    return originalTotal > 0 ? currentTotal / originalTotal : 1.0;
  }

  private checkCriticalInfoPreserved(original: OptimizableContext, optimized: OptimizableContext): boolean {
    // Check if critical conversation items are preserved
    if (original.conversationHistory && optimized.conversationHistory) {
      const originalCritical = original.conversationHistory.filter(conv => conv.contextValue === 'critical');
      const optimizedCritical = optimized.conversationHistory.filter(conv => conv.contextValue === 'critical');
      if (originalCritical.length > 0 && optimizedCritical.length < originalCritical.length) {
        return false;
      }
    }

    // Check if high-reliability knowledge is preserved
    if (original.knowledgeBase && optimized.knowledgeBase) {
      const originalHighRel = original.knowledgeBase.filter(kb => kb.reliability > 0.8);
      const optimizedHighRel = optimized.knowledgeBase.filter(kb => kb.reliability > 0.8);
      if (originalHighRel.length > 0 && optimizedHighRel.length < originalHighRel.length) {
        return false;
      }
    }

    return true;
  }

  private checkRecentInfoPreserved(original: OptimizableContext, optimized: OptimizableContext): boolean {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    if (original.conversationHistory && optimized.conversationHistory) {
      const originalRecent = original.conversationHistory.filter(conv => conv.timestamp > twoHoursAgo);
      const optimizedRecent = optimized.conversationHistory.filter(conv => conv.timestamp > twoHoursAgo);
      if (originalRecent.length > 0 && optimizedRecent.length < originalRecent.length * 0.8) {
        return false;
      }
    }

    return true;
  }

  private generateOptimizationRecommendations(
    request: ContextOptimizationRequest,
    optimizations: AppliedOptimization[],
    qualityMetrics: ContextOptimizationResult['qualityMetrics']
  ): string[] {
    const recommendations: string[] = [];

    // Strategy-specific recommendations
    switch (request.optimizationStrategy) {
      case 'compression':
        recommendations.push('Consider adjusting compression level based on quality requirements');
        break;
      case 'truncation':
        recommendations.push('Monitor impact on conversation flow after truncation');
        break;
      case 'summarization':
        recommendations.push('Verify that key information is preserved in summaries');
        break;
      case 'relevance_filtering':
        recommendations.push('Fine-tune relevance threshold based on query types');
        break;
      case 'hierarchical':
        recommendations.push('Review hierarchy levels for optimal context retention');
        break;
    }

    // Quality-based recommendations
    if (qualityMetrics.relevanceRetention < 0.8) {
      recommendations.push('Consider reducing optimization intensity to maintain relevance');
    }

    if (!qualityMetrics.criticalInfoPreserved) {
      recommendations.push('Adjust strategy to preserve critical information');
    }

    if (!qualityMetrics.recentInfoPreserved) {
      recommendations.push('Implement recent information preservation rules');
    }

    // Token budget recommendations
    if (request.tokenBudgetStrategy === 'strict' && request.maxTokens < 1000) {
      recommendations.push('Consider using adaptive token budget for better allocation');
    }

    return recommendations;
  }

  private cacheOptimizationResult(result: ContextOptimizationResult): void {
    const cacheKey = this.generateCacheKey(result);
    this.optimizationCache.set(cacheKey, {
      result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
  }

  private generateCacheKey(result: ContextOptimizationResult): string {
    const keyData = {
      strategy: result.optimizationStrategy,
      tokenBudget: result.tokenReduction.optimized,
      originalTokens: result.tokenReduction.original,
      contextHash: createHash('md5').update(JSON.stringify(result.originalContext)).digest('hex')
    };
    return createHash('md5').update(JSON.stringify(keyData) + this.cryptoKey).digest('hex');
  }

  private generateOptimizationId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      for (const [key, cached] of this.optimizationCache.entries()) {
        if (cached.expiresAt < now) {
          this.optimizationCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logInfo('Optimization cache cleanup completed', {
          componentName: 'ContextOptimizer',
          entriesRemoved: cleaned,
          remainingEntries: this.optimizationCache.size
        });
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  private async logOptimizationResult(request: ContextOptimizationRequest, result: ContextOptimizationResult): Promise<void> {
    try {
      // This would integrate with the existing logging system
      logInfo('Context optimization result logged', {
        componentName: 'ContextOptimizer',
        optimizationId: result.optimizationId,
        strategy: result.optimizationStrategy,
        reductionRatio: result.tokenReduction.reductionRatio,
        qualityRetention: result.qualityMetrics.relevanceRetention
      });
    } catch (error) {
      logWarning('Failed to log optimization result', { error });
    }
  }

  /**
   * Cleanup on instance destruction
   */
  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.optimizationCache.clear();
    this.tokenCounters.clear();
  }
}

// Export singleton instance
export const contextOptimizer = new ContextOptimizer();

// Convenience functions
export const optimizeContext = (request: ContextOptimizationRequest) => 
  contextOptimizer.optimizeContext(request);

export const allocateTokenBudget = (context: OptimizableContext, budget: number, strategy?: TokenBudgetStrategy) => 
  contextOptimizer.allocateTokenBudget(context, budget, strategy);

export const calculateRelevanceScores = (context: OptimizableContext, userId: string, query?: string) => 
  contextOptimizer.calculateRelevanceScores(context, userId, query);

export const adjustContextDynamically = (request: DynamicAdjustmentRequest) => 
  contextOptimizer.adjustContextDynamically(request);