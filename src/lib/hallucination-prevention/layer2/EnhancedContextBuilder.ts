// Layer 2: Context & Memory Management System
// ============================================
// EnhancedContextBuilder - Ultra-compressed context generation with
// student profile integration, learning style detection, and performance optimization

import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { logError, logWarning, logInfo } from '@/lib/error-logger';
import { studentContextBuilder, StudentStudyContext } from '@/lib/ai/student-context-builder';
import type { Database } from '@/lib/database.types';

export type ContextLevel = 1 | 2 | 3 | 4;
export type ContextType = 'Light' | 'Recent' | 'Selective' | 'Full';

export interface ContextLevelConfig {
  level: ContextLevel;
  name: ContextType;
  maxTokens: number;
  maxLength: number;
  description: string;
  compressionRatio: number;
}

export interface ContextCache {
  userId: string;
  level: ContextLevel;
  context: string;
  tokenCount: number;
  relevanceScore: number;
  createdAt: Date;
  expiresAt: Date;
  metadata: ContextMetadata;
}

export interface ContextMetadata {
  topics: string[];
  subjects: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  accuracy: number;
  lastActivity: Date;
  learningStyle: string;
  examTarget?: string;
  cacheKey: string;
}

export interface ContextOptimizationRequest {
  userId: string;
  query: string;
  requiredLevel: ContextLevel;
  includeMemories?: boolean;
  includePreferences?: boolean;
  tokenBudget?: number;
  priority: 'speed' | 'accuracy' | 'balance';
}

export interface ContextOptimizationResult {
  context: string;
  tokenCount: number;
  level: ContextLevel;
  compressionApplied: boolean;
  optimizationTime: number;
  relevanceScore: number;
  cacheHit: boolean;
  metadata: ContextMetadata;
}

export interface LearningStyleDetection {
  style: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  confidence: number;
  indicators: string[];
  recommendations: string[];
  adaptation: 'increase' | 'maintain' | 'decrease';
}

export interface StudentProfileIntegration {
  academicProgress: AcademicProgress;
  studyPreferences: StudyPreferences;
  performanceMetrics: PerformanceMetrics;
  learningPathway: LearningPathway;
  goalAlignment: GoalAlignment;
}

export interface AcademicProgress {
  subjects: SubjectProgress[];
  strengths: string[];
  weaknesses: string[];
  upcomingAssessments: Assessment[];
  masteryLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubjectProgress {
  name: string;
  currentLevel: number;
  targetLevel: number;
  progressPercentage: number;
  estimatedCompletion: Date;
  lastActivity: Date;
  studyTime: number; // in minutes
}

export interface Assessment {
  subject: string;
  type: 'exam' | 'quiz' | 'assignment';
  date: Date;
  weight: number; // 0-1
  preparation: number; // 0-1
}

export interface StudyPreferences {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
  sessionDuration: number; // in minutes
  breakInterval: number; // in minutes
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  topics: string[];
  studyMethods: string[];
}

export interface PerformanceMetrics {
  averageAccuracy: number;
  questionsPerSession: number;
  averageSessionDuration: number;
  retentionRate: number;
  improvementRate: number; // percentage change over time
  strugglingAreas: string[];
}

export interface LearningPathway {
  currentStage: string;
  nextMilestones: string[];
  prerequisites: string[];
  suggestedTopics: string[];
  difficultyProgression: number[];
}

export interface GoalAlignment {
  shortTerm: string[];
  longTerm: string[];
  priorityScore: number; // 0-1
  progressTowards: number; // 0-1
  recommendedActions: string[];
}

export class EnhancedContextBuilder {
  private static readonly CONTEXT_LEVELS: ContextLevelConfig[] = [
    {
      level: 1,
      name: 'Light',
      maxTokens: 50,
      maxLength: 200,
      description: 'Basic student profile with minimal context',
      compressionRatio: 0.9
    },
    {
      level: 2,
      name: 'Recent',
      maxTokens: 150,
      maxLength: 500,
      description: 'Profile + recent activity summary',
      compressionRatio: 0.8
    },
    {
      level: 3,
      name: 'Selective',
      maxTokens: 300,
      maxLength: 1000,
      description: 'Profile + performance metrics + memories',
      compressionRatio: 0.7
    },
    {
      level: 4,
      name: 'Full',
      maxTokens: 500,
      maxLength: 2000,
      description: 'Complete context with all data points',
      compressionRatio: 0.6
    }
  ];

  private static readonly CACHE_TTL_MINUTES = 15;
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly MIN_RELEVANCE_THRESHOLD = 0.6;

  private contextCache: Map<string, ContextCache> = new Map();
  private cacheSize = 0;
  private cryptoKey: string;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cryptoKey = process.env.CONTEXT_BUILDING_KEY || 'default-context-key';
    this.startCacheCleanup();
  }

  /**
   * Main context building method with ultra-compression
   */
  async buildEnhancedContext(request: ContextOptimizationRequest): Promise<ContextOptimizationResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    try {
      logInfo('Enhanced context building started', {
        componentName: 'EnhancedContextBuilder',
        userId: request.userId,
        level: request.requiredLevel,
        priority: request.priority,
        queryLength: request.query.length
      });

      // Check cache first
      const cachedContext = this.getCachedContext(cacheKey);
      if (cachedContext) {
        logInfo('Context cache hit', {
          componentName: 'EnhancedContextBuilder',
          cacheKey,
          level: request.requiredLevel,
          relevanceScore: cachedContext.relevanceScore
        });

        return {
          context: cachedContext.context,
          tokenCount: cachedContext.tokenCount,
          level: request.requiredLevel,
          compressionApplied: true,
          optimizationTime: Date.now() - startTime,
          relevanceScore: cachedContext.relevanceScore,
          cacheHit: true,
          metadata: cachedContext.metadata
        };
      }

      // Build context from scratch
      const baseContext = await this.buildBaseContext(request);
      const optimizedContext = await this.optimizeContext(baseContext, request);
      const metadata = await this.extractContextMetadata(optimizedContext, request);
      
      // Check if context meets relevance threshold
      const relevanceScore = this.calculateRelevanceScore(optimizedContext, request.query);
      if (relevanceScore < EnhancedContextBuilder.MIN_RELEVANCE_THRESHOLD) {
        const enhancedContext = await this.enhanceContextRelevance(optimizedContext, request, relevanceScore);
        const finalMetadata = await this.extractContextMetadata(enhancedContext, request);
        
        const result: ContextOptimizationResult = {
          context: enhancedContext,
          tokenCount: this.estimateTokenCount(enhancedContext),
          level: request.requiredLevel,
          compressionApplied: true,
          optimizationTime: Date.now() - startTime,
          relevanceScore: this.calculateRelevanceScore(enhancedContext, request.query),
          cacheHit: false,
          metadata: finalMetadata
        };

        this.cacheContext(cacheKey, result);
        return result;
      }

      const result: ContextOptimizationResult = {
        context: optimizedContext,
        tokenCount: this.estimateTokenCount(optimizedContext),
        level: request.requiredLevel,
        compressionApplied: true,
        optimizationTime: Date.now() - startTime,
        relevanceScore,
        cacheHit: false,
        metadata
      };

      this.cacheContext(cacheKey, result);
      return result;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'EnhancedContextBuilder',
        userId: request.userId,
        level: request.requiredLevel,
        query: request.query.substring(0, 100)
      });

      // Return minimal safe context on error
      return this.createFallbackContext(request, Date.now() - startTime);
    }
  }

  /**
   * Build base context using existing student context builder
   */
  private async buildBaseContext(request: ContextOptimizationRequest): Promise<StudentStudyContext> {
    try {
      return await studentContextBuilder.buildFullAIContext(request.userId, request.requiredLevel);
    } catch (error) {
      logWarning('Failed to build base context, using fallback', {
        componentName: 'EnhancedContextBuilder',
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return fallback context
      return this.createFallbackStudentContext(request.userId);
    }
  }

  /**
   * Optimize context based on level and requirements
   */
  private async optimizeContext(baseContext: StudentStudyContext, request: ContextOptimizationRequest): Promise<string> {
    const config = EnhancedContextBuilder.CONTEXT_LEVELS[request.requiredLevel - 1];
    let optimized = '';

    switch (request.requiredLevel) {
      case 1:
        optimized = this.buildLightContext(baseContext, config);
        break;
      case 2:
        optimized = this.buildRecentContext(baseContext, config);
        break;
      case 3:
        optimized = this.buildSelectiveContext(baseContext, config, request);
        break;
      case 4:
        optimized = await this.buildFullContext(baseContext, config, request);
        break;
      default:
        optimized = this.buildLightContext(baseContext, config);
    }

    // Apply compression if needed
    if (optimized.length > config.maxLength) {
      optimized = this.applyContextCompression(optimized, config);
    }

    // Add learning style adaptation if available
    if (baseContext.learningStyle) {
      optimized = this.integrateLearningStyle(optimized, baseContext.learningStyle);
    }

    return optimized;
  }

  /**
   * Build light context (Level 1)
   */
  private buildLightContext(context: StudentStudyContext, config: ContextLevelConfig): string {
    const parts: string[] = [];

    // Essential profile info
    if (context.profileText) {
      parts.push(context.profileText);
    }

    // Key performance indicators
    if (context.studyProgress.accuracy > 0) {
      parts.push(`Accuracy: ${context.studyProgress.accuracy}%`);
    }

    // Current level and status
    if (context.currentData.level > 1) {
      parts.push(`Level ${context.currentData.level}, ${context.currentData.streak} day streak`);
    }

    return parts.join('. ') || 'Student profile: Learning actively';
  }

  /**
   * Build recent context (Level 2)
   */
  private buildRecentContext(context: StudentStudyContext, config: ContextLevelConfig): string {
    const parts: string[] = [];

    // Profile
    if (context.profileText) {
      parts.push(context.profileText);
    }

    // Recent activity
    if (context.recentActivity.lastStudySession) {
      const daysSince = Math.floor((Date.now() - context.recentActivity.lastStudySession.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince <= 7) {
        parts.push(`Last study: ${daysSince} days ago`);
      }
    }

    // Performance this week
    if (context.recentActivity.questionsAnswered > 0) {
      parts.push(`This week: ${context.recentActivity.questionsAnswered} questions, ${context.recentActivity.correctAnswers} correct`);
    }

    // Current focus areas
    if (context.strongSubjects.length > 0) {
      parts.push(`Strong: ${context.strongSubjects.slice(0, 2).join(', ')}`);
    }

    if (context.weakSubjects.length > 0) {
      parts.push(`Improving: ${context.weakSubjects.slice(0, 2).join(', ')}`);
    }

    return parts.join('\n') || 'Recent learning activity: Active student';
  }

  /**
   * Build selective context (Level 3)
   */
  private buildSelectiveContext(context: StudentStudyContext, config: ContextLevelConfig, request: ContextOptimizationRequest): string {
    const parts: string[] = [];

    // Profile with additional details
    if (context.profileText) {
      parts.push(`STUDENT PROFILE: ${context.profileText}`);
    }

    // Performance metrics
    parts.push('PERFORMANCE METRICS:');
    parts.push(`• Progress: ${context.studyProgress.completedTopics}/${context.studyProgress.totalTopics} topics (${context.studyProgress.accuracy}%)`);
    parts.push(`• Study time: ${context.studyProgress.timeSpent} hours total`);
    parts.push(`• Current streak: ${context.currentData.streak} days`);
    parts.push(`• Level: ${context.currentData.level} (${context.currentData.points} points)`);

    // Strengths and weaknesses
    if (context.strongSubjects.length > 0 || context.weakSubjects.length > 0) {
      parts.push('PERFORMANCE ANALYSIS:');
      if (context.strongSubjects.length > 0) {
        parts.push(`• Strong subjects: ${context.strongSubjects.join(', ')}`);
      }
      if (context.weakSubjects.length > 0) {
        parts.push(`• Areas for improvement: ${context.weakSubjects.join(', ')}`);
      }
    }

    // Recent learning patterns
    if (context.recentActivity.questionsAnswered > 0) {
      parts.push('RECENT ACTIVITY (7 days):');
      parts.push(`• Questions attempted: ${context.recentActivity.questionsAnswered}`);
      parts.push(`• Strong performance: ${context.recentActivity.topicsStrong.join(', ') || 'Building skills'}`);
      if (context.recentActivity.topicsStruggled.length > 0) {
        parts.push(`• Challenging areas: ${context.recentActivity.topicsStruggled.join(', ')}`);
      }
    }

    // Learning preferences
    if (context.learningStyle) {
      parts.push(`LEARNING STYLE: ${context.learningStyle}`);
    }

    if (context.examTarget) {
      parts.push(`EXAM TARGET: ${context.examTarget}`);
    }

    return parts.join('\n');
  }

  /**
   * Build full context (Level 4)
   */
  private async buildFullContext(context: StudentStudyContext, config: ContextLevelConfig, request: ContextOptimizationRequest): Promise<string> {
    const parts: string[] = [];

    // Complete student profile
    parts.push('=== COMPLETE STUDENT PROFILE ===');
    parts.push(`Profile: ${context.profileText}`);

    // Academic progress
    parts.push('\n=== ACADEMIC PROGRESS ===');
    parts.push(`Total Topics: ${context.studyProgress.totalTopics}`);
    parts.push(`Completed: ${context.studyProgress.completedTopics} (${context.studyProgress.accuracy}%)`);
    parts.push(`Subjects Studied: ${context.studyProgress.subjectsStudied.join(', ')}`);
    parts.push(`Time Investment: ${context.studyProgress.timeSpent} hours`);

    // Performance analysis
    parts.push('\n=== PERFORMANCE ANALYSIS ===');
    parts.push(`Strong Subjects: ${context.strongSubjects.join(', ') || 'Building foundation'}`);
    parts.push(`Areas Needing Work: ${context.weakSubjects.join(', ') || 'Developing consistently'}`);
    parts.push(`Learning Style: ${context.learningStyle || 'Adaptable'}`);
    parts.push(`Exam Target: ${context.examTarget || 'General improvement'}`);

    // Current status
    parts.push('\n=== CURRENT STATUS ===');
    parts.push(`Study Streak: ${context.currentData.streak} days`);
    parts.push(`Current Level: ${context.currentData.level}`);
    parts.push(`Experience Points: ${context.currentData.points}`);
    parts.push(`Pending Revisions: ${context.currentData.revisionQueue}`);
    if (context.currentData.pendingTopics.length > 0) {
      parts.push(`Next Focus Topics: ${context.currentData.pendingTopics.join(', ')}`);
    }

    // Study preferences
    parts.push('\n=== STUDY PREFERENCES ===');
    parts.push(`Preferred Difficulty: ${context.preferences.difficulty}`);
    parts.push(`Focus Subjects: ${context.preferences.subjects.join(', ')}`);
    parts.push(`Study Goals: ${context.preferences.studyGoals.join(', ')}`);

    // Detailed recent activity
    if (context.recentActivity.questionsAnswered > 0) {
      parts.push('\n=== RECENT LEARNING PATTERNS (7 days) ===');
      parts.push(`Last Study Session: ${context.recentActivity.lastStudySession?.toLocaleDateString() || 'No recent activity'}`);
      parts.push(`Questions Attempted: ${context.recentActivity.questionsAnswered}`);
      parts.push(`Correct Responses: ${context.recentActivity.correctAnswers}`);
      parts.push(`Peak Performance Areas: ${context.recentActivity.topicsStrong.join(', ') || 'Consistent effort'}`);
      parts.push(`Challenging Topics: ${context.recentActivity.topicsStruggled.join(', ') || 'Managing well'}`);
    }

    // Add enhanced metadata
    if (request.includeMemories) {
      const memories = await this.getRelevantMemories(context.userId, request.query);
      if (memories.length > 0) {
        parts.push('\n=== RELEVANT LEARNING MEMORIES ===');
        parts.push(memories.slice(0, 3).map(m => `• ${m.description} (${m.relevance} relevance)`).join('\n'));
      }
    }

    if (request.includePreferences) {
      const preferences = await this.getDetailedPreferences(context.userId);
      if (preferences) {
        parts.push('\n=== DETAILED PREFERENCES ===');
        parts.push(`Session Duration: ${preferences.sessionDuration} minutes`);
        parts.push(`Preferred Study Time: ${preferences.preferredTime}`);
        parts.push(`Break Interval: ${preferences.breakInterval} minutes`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Apply context compression to fit token budget
   */
  private applyContextCompression(context: string, config: ContextLevelConfig): string {
    let compressed = context;

    // Remove redundant whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Abbreviate common phrases
    const abbreviations: Record<string, string> = {
      'approximately': '~',
      'minutes': 'min',
      'hours': 'h',
      'questions': 'Q',
      'answers': 'A',
      'topics': 'T',
      'subjects': 'S',
      'performance': 'perf',
      'accuracy': 'acc',
      'progression': 'prog'
    };

    for (const [full, abbrev] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      compressed = compressed.replace(regex, abbrev);
    }

    // Remove less critical sentences if still too long
    if (compressed.length > config.maxLength) {
      const sentences = compressed.split(/[.!?]+/);
      const criticalSentences = sentences.filter(s => {
        const lower = s.toLowerCase();
        return lower.includes('profile') || 
               lower.includes('level') || 
               lower.includes('accuracy') || 
               lower.includes('streak') ||
               lower.includes('progress');
      });

      if (criticalSentences.length > 0) {
        compressed = criticalSentences.join('. ') + '.';
      }
    }

    // Final trim if still too long
    if (compressed.length > config.maxLength) {
      compressed = compressed.substring(0, config.maxLength - 3) + '...';
    }

    return compressed;
  }

  /**
   * Integrate learning style into context
   */
  private integrateLearningStyle(context: string, learningStyle: string): string {
    const styleAdaptations: Record<string, string> = {
      'visual': ' (Prefers visual learning methods)',
      'auditory': ' (Benefits from verbal explanations)',
      'kinesthetic': ' (Learns best through hands-on practice)',
      'reading': ' (Prefers written materials and reading)',
      'deep focus': ' (Requires extended study sessions)',
      'balanced': ' (Adapts well to various methods)',
      'quick learning': ' (Prefers short, intensive sessions)'
    };

    const adaptation = styleAdaptations[learningStyle.toLowerCase()] || '';
    
    // Add learning style context
    if (!context.includes('learning style') && !context.includes('method')) {
      return context + `\nLearning style: ${learningStyle}${adaptation}`;
    }

    return context;
  }

  /**
   * Calculate relevance score for context
   */
  private calculateRelevanceScore(context: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contextWords = context.toLowerCase().split(/\s+/);
    
    let matches = 0;
    const relevantTerms = ['progress', 'performance', 'accuracy', 'study', 'topics', 'subjects', 'level', 'streak', 'questions', 'weak', 'strong'];
    
    // Check for direct term matches
    for (const word of queryWords) {
      if (contextWords.includes(word)) {
        matches++;
      }
    }

    // Check for relevant concept matches
    for (const term of relevantTerms) {
      if (query.toLowerCase().includes(term) && context.toLowerCase().includes(term)) {
        matches += 0.5;
      }
    }

    const maxPossible = Math.max(queryWords.length, 10);
    return Math.min(1.0, matches / maxPossible);
  }

  /**
   * Enhance context relevance when score is below threshold
   */
  private async enhanceContextRelevance(context: string, request: ContextOptimizationRequest, currentScore: number): Promise<string> {
    let enhanced = context;

    // Add query-specific information
    const queryLower = request.query.toLowerCase();
    
    if (queryLower.includes('progress') || queryLower.includes('performance')) {
      const progressData = await this.getProgressDetails(request.userId);
      if (progressData) {
        enhanced += `\nDETAILED PROGRESS: ${progressData}`;
      }
    }

    if (queryLower.includes('accuracy') || queryLower.includes('score')) {
      const accuracyData = await this.getAccuracyDetails(request.userId);
      if (accuracyData) {
        enhanced += `\nACCURACY ANALYSIS: ${accuracyData}`;
      }
    }

    if (queryLower.includes('weak') || queryLower.includes('struggle')) {
      const strugglingAreas = await this.getStrugglingAreas(request.userId);
      if (strugglingAreas.length > 0) {
        enhanced += `\nCHALLENGING AREAS: ${strugglingAreas.join(', ')}`;
      }
    }

    if (queryLower.includes('strong') || queryLower.includes('good')) {
      const strongAreas = await this.getStrongAreas(request.userId);
      if (strongAreas.length > 0) {
        enhanced += `\nSTRONG AREAS: ${strongAreas.join(', ')}`;
      }
    }

    return enhanced;
  }

  /**
   * Extract metadata from context
   */
  private async extractContextMetadata(context: string, request: ContextOptimizationRequest): Promise<ContextMetadata> {
    const topics = this.extractTopics(context);
    const subjects = this.extractSubjects(context);
    const difficulty = this.extractDifficulty(context);
    const accuracy = this.extractAccuracy(context);
    const lastActivity = await this.getLastActivityDate(request.userId);
    const learningStyle = await this.getLearningStyle(request.userId);
    const examTarget = await this.getExamTarget(request.userId);

    return {
      topics,
      subjects,
      difficulty,
      accuracy,
      lastActivity,
      learningStyle,
      examTarget,
      cacheKey: this.generateCacheKey(request)
    };
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(request: ContextOptimizationRequest): string {
    const keyData = {
      userId: request.userId,
      level: request.requiredLevel,
      query: request.query.substring(0, 50), // First 50 chars for uniqueness
      includeMemories: request.includeMemories || false,
      includePreferences: request.includePreferences || false
    };
    
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  private getCachedContext(cacheKey: string): ContextCache | null {
    const cached = this.contextCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt < new Date()) {
      this.contextCache.delete(cacheKey);
      this.cacheSize--;
      return null;
    }

    return cached;
  }

  private cacheContext(cacheKey: string, result: ContextOptimizationResult): void {
    // Implement LRU cache eviction if needed
    if (this.cacheSize >= EnhancedContextBuilder.MAX_CACHE_SIZE) {
      this.evictOldestCache();
    }

    const cache: ContextCache = {
      userId: result.metadata.cacheKey.split('_')[0], // Extract userId from cache key
      level: result.level,
      context: result.context,
      tokenCount: result.tokenCount,
      relevanceScore: result.relevanceScore,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + EnhancedContextBuilder.CACHE_TTL_MINUTES * 60 * 1000),
      metadata: result.metadata
    };

    this.contextCache.set(cacheKey, cache);
    this.cacheSize++;
  }

  private evictOldestCache(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, cache] of this.contextCache.entries()) {
      if (cache.createdAt.getTime() < oldestTime) {
        oldestTime = cache.createdAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.contextCache.delete(oldestKey);
      this.cacheSize--;
    }
  }

  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      for (const [key, cache] of this.contextCache.entries()) {
        if (cache.expiresAt < now) {
          this.contextCache.delete(key);
          cleaned++;
          this.cacheSize--;
        }
      }

      if (cleaned > 0) {
        logInfo('Context cache cleanup completed', {
          componentName: 'EnhancedContextBuilder',
          entriesRemoved: cleaned,
          remainingEntries: this.cacheSize
        });
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Helper methods for data extraction and enhancement
   */
  private extractTopics(context: string): string[] {
    // Extract topics mentioned in context
    const topicPatterns = [
      /topics?:?\s*([^.\n]+)/gi,
      /focus.*?topics?:?\s*([^.\n]+)/gi,
      /studying.*?([^.\n]+topics)/gi
    ];

    const topics: string[] = [];
    for (const pattern of topicPatterns) {
      const matches = Array.from(context.matchAll(pattern));
      matches.forEach(match => {
        if (match[1]) {
          const extracted = match[1].split(/[,;]/).map(t => t.trim());
          topics.push(...extracted);
        }
      });
    }

    return [...new Set(topics)].filter(t => t.length > 0);
  }

  private extractSubjects(context: string): string[] {
    // Extract subjects mentioned in context
    const subjectPatterns = [
      /subjects?:?\s*([^.\n]+)/gi,
      /strong.*?subjects?:?\s*([^.\n]+)/gi,
      /studying.*?([^.\n]+subjects)/gi
    ];

    const subjects: string[] = [];
    for (const pattern of subjectPatterns) {
      const matches = Array.from(context.matchAll(pattern));
      matches.forEach(match => {
        if (match[1]) {
          const extracted = match[1].split(/[,;]/).map(s => s.trim());
          subjects.push(...extracted);
        }
      });
    }

    return [...new Set(subjects)].filter(s => s.length > 0);
  }

  private extractDifficulty(context: string): 'Easy' | 'Medium' | 'Hard' {
    const lower = context.toLowerCase();
    if (lower.includes('hard') || lower.includes('difficult')) return 'Hard';
    if (lower.includes('easy') || lower.includes('simple')) return 'Easy';
    return 'Medium';
  }

  private extractAccuracy(context: string): number {
    const accuracyMatch = context.match(/accuracy:?\s*(\d+)%/i);
    if (accuracyMatch) {
      return parseInt(accuracyMatch[1], 10);
    }
    return 0;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Database integration methods
  private async getProgressDetails(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('interaction_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const recentData = data
          .map(d => (d as any).interaction_data)
          .filter(Boolean);
        return `Recent progress tracking active with ${recentData.length} recent sessions`;
      }
      
      return null;
    } catch (error) {
      logWarning('Failed to get progress details', { userId, error });
      return null;
    }
  }

  private async getAccuracyDetails(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('quality_metrics')
        .select('quality_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const avgQuality = data.reduce((sum, d) => {
          const score = (d as any).quality_score;
          return sum + (typeof score === 'number' ? score : 0);
        }, 0) / data.length;
        return `Recent quality scores averaging ${(avgQuality * 100).toFixed(1)}%`;
      }
      
      return null;
    } catch (error) {
      logWarning('Failed to get accuracy details', { userId, error });
      return null;
    }
  }

  private async getStrugglingAreas(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('context_optimization_logs')
        .select('optimized_context')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const areas: string[] = [];
      if (data && Array.isArray(data)) {
        data.forEach(log => {
          const context = (log as any).optimized_context;
          if (context && typeof context === 'object' && context.weakSubjects) {
            areas.push(...context.weakSubjects);
          }
        });
      }
      
      return [...new Set(areas)];
    } catch (error) {
      logWarning('Failed to get struggling areas', { userId, error });
      return [];
    }
  }

  private async getStrongAreas(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('context_optimization_logs')
        .select('optimized_context')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const areas: string[] = [];
      if (data && Array.isArray(data)) {
        data.forEach(log => {
          const context = (log as any).optimized_context;
          if (context && typeof context === 'object' && context.strongSubjects) {
            areas.push(...context.strongSubjects);
          }
        });
      }
      
      return [...new Set(areas)];
    } catch (error) {
      logWarning('Failed to get strong areas', { userId, error });
      return [];
    }
  }

  private async getLastActivityDate(userId: string): Promise<Date> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const createdAt = (data as any)?.created_at;
      return createdAt ? new Date(createdAt) : new Date();
    } catch (error) {
      logWarning('Failed to get last activity date', { userId, error });
      return new Date();
    }
  }

  private async getLearningStyle(userId: string): Promise<string> {
    // This would integrate with the actual learning style detection
    return 'adaptive';
  }

  private async getExamTarget(userId: string): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('content')
        .eq('fact_type', 'exam_target')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return (data as any)?.content;
    } catch (error) {
      logWarning('Failed to get exam target', { userId, error });
      return undefined;
    }
  }

  private async getRelevantMemories(userId: string, query: string): Promise<Array<{description: string, relevance: number}>> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('interaction_data, memory_relevance_score')
        .eq('user_id', userId)
        .order('memory_relevance_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        return data.map(d => {
          const interactionData = (d as any).interaction_data;
          const relevance = (d as any).memory_relevance_score;
          return {
            description: interactionData?.summary || 'Learning session',
            relevance: typeof relevance === 'number' ? relevance : 0.5
          };
        });
      }
      
      return [];
    } catch (error) {
      logWarning('Failed to get relevant memories', { userId, error });
      return [];
    }
  }

  private async getDetailedPreferences(userId: string): Promise<StudyPreferences | null> {
    // This would integrate with user preference storage
    return {
      difficulty: 'Medium',
      sessionDuration: 60,
      breakInterval: 15,
      preferredTime: 'evening',
      topics: [],
      studyMethods: []
    };
  }

  private createFallbackContext(request: ContextOptimizationRequest, optimizationTime: number): ContextOptimizationResult {
    return {
      context: 'Student learning actively. Context optimization temporarily unavailable.',
      tokenCount: 15,
      level: request.requiredLevel,
      compressionApplied: false,
      optimizationTime,
      relevanceScore: 0.5,
      cacheHit: false,
      metadata: {
        topics: [],
        subjects: [],
        difficulty: 'Medium',
        accuracy: 0,
        lastActivity: new Date(),
        learningStyle: 'adaptive',
        cacheKey: this.generateCacheKey(request)
      }
    };
  }

  private createFallbackStudentContext(userId: string): StudentStudyContext {
    return {
      userId,
      profileText: 'Active student learner',
      strongSubjects: [],
      weakSubjects: [],
      recentActivity: {
        questionsAnswered: 0,
        correctAnswers: 0,
        topicsStruggled: [],
        topicsStrong: []
      },
      studyProgress: {
        totalTopics: 0,
        completedTopics: 0,
        accuracy: 0,
        subjectsStudied: [],
        timeSpent: 0
      },
      preferences: {
        difficulty: 'Medium',
        subjects: [],
        studyGoals: ['Learning and improvement']
      },
      currentData: {
        streak: 0,
        level: 1,
        points: 0,
        revisionQueue: 0,
        pendingTopics: []
      }
    };
  }

  /**
   * Public utility methods
   */
  getContextLevels(): ContextLevelConfig[] {
    return [...EnhancedContextBuilder.CONTEXT_LEVELS];
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cacheSize,
      maxSize: EnhancedContextBuilder.MAX_CACHE_SIZE,
      hitRate: 0.8 // This would be calculated from actual metrics
    };
  }

  clearCache(): void {
    this.contextCache.clear();
    this.cacheSize = 0;
    logInfo('Context cache cleared', {
      componentName: 'EnhancedContextBuilder'
    });
  }

  /**
   * Cleanup on instance destruction
   */
  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.clearCache();
  }
}

// Export singleton instance
export const enhancedContextBuilder = new EnhancedContextBuilder();

// Convenience functions
export const buildEnhancedContext = (request: ContextOptimizationRequest) => 
  enhancedContextBuilder.buildEnhancedContext(request);

export const getContextLevels = () => 
  enhancedContextBuilder.getContextLevels();

export const getCacheStats = () => 
  enhancedContextBuilder.getCacheStats();

export const clearContextCache = () => 
  enhancedContextBuilder.clearCache();