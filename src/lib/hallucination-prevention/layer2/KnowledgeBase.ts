// Layer 2: Context & Memory Management System
// ============================================
// KnowledgeBase - Knowledge base management with source integration,
// verification, fact database management, and search capabilities

import { supabase } from '@/lib/supabase';
import { logError, logWarning, logInfo } from '@/lib/error-logger';
import { createHash } from 'crypto';

export type SourceType = 'knowledge_base' | 'knowledge_sources' | 'user_profile' | 'conversation_history' | 'external_api' | 'educational_resource';
export type VerificationStatus = 'pending' | 'verified' | 'disputed' | 'rejected';
export type FactType = 'fact' | 'opinion' | 'hypothesis' | 'definition' | 'example' | 'procedure';

export interface KnowledgeSource {
  id: string;
  title: string;
  sourceType: SourceType;
  url?: string;
  author?: string;
  publicationDate?: Date;
  reliabilityScore: number;
  verificationStatus: VerificationStatus;
  citationCount: number;
  metadata: Record<string, any>;
  content: string;
  contentHash: string;
  topics: string[];
  factType: FactType;
  confidenceScore: number;
  verifiedAt?: Date;
  verifiedBy?: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface SourceSearchRequest {
  query: string;
  sourceType?: SourceType;
  factType?: FactType;
  verificationStatus?: VerificationStatus;
  minReliability?: number;
  maxResults?: number;
  includeContent?: boolean;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  topics?: string[];
  relevanceThreshold?: number;
}

export interface SourceSearchResult {
  source: KnowledgeSource;
  relevanceScore: number;
  matches: SearchMatch[];
  context: string;
}

export interface SearchMatch {
  field: string;
  snippet: string;
  highlight: string;
  confidence: number;
}

export interface SourceIntegrationRequest {
  sourceId: string;
  userId: string;
  context: string;
  integrationType: 'reference' | 'citation' | 'cross_reference' | 'verification';
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface SourceIntegrationResult {
  integrationId: string;
  source: KnowledgeSource;
  integrationStatus: 'success' | 'failed' | 'partial';
  verificationResults?: VerificationResult[];
  recommendations: string[];
  context: string;
  processingTime: number;
}

export interface VerificationResult {
  sourceId: string;
  verificationType: 'content' | 'source' | 'cross_reference' | 'expert_review';
  status: 'verified' | 'disputed' | 'inconclusive';
  confidence: number;
  evidence: string[];
  issues: string[];
  verifier: string;
  verifiedAt: Date;
}

export interface KnowledgeBaseStats {
  totalSources: number;
  verifiedSources: number;
  pendingVerification: number;
  disputedSources: number;
  averageReliability: number;
  totalCitations: number;
  sourcesByType: Record<SourceType, number>;
  sourcesByFactType: Record<FactType, number>;
  recentActivity: {
    newSources: number;
    verifications: number;
    disputes: number;
    citations: number;
  };
}

export interface CrossReferenceResult {
  sourceId: string;
  relatedSources: Array<{
    source: KnowledgeSource;
    relationshipType: 'supports' | 'contradicts' | 'extends' | 'references';
    strength: number;
    evidence: string[];
  }>;
  consensusScore: number;
  conflicts: Array<{
    conflictingSource: KnowledgeSource;
    conflictType: 'contradiction' | 'incompatibility' | 'gap';
    description: string;
  }>;
  recommendations: string[];
}

export class KnowledgeBase {
  private static readonly MAX_SEARCH_RESULTS = 50;
  private static readonly MIN_RELIABILITY_THRESHOLD = 0.5;
  private static readonly VERIFICATION_TIMEOUT_MS = 10000;
  private static readonly MAX_CROSS_REFERENCES = 10;

  private cryptoKey: string;
  private searchCache: Map<string, { result: SourceSearchResult[], timestamp: Date, expiresAt: Date }> = new Map();
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cryptoKey = process.env.KNOWLEDGE_BASE_KEY || 'default-knowledge-base-key';
    this.startCacheCleanup();
  }

  /**
   * Search knowledge base with advanced filtering
   */
  async searchSources(request: SourceSearchRequest): Promise<SourceSearchResult[]> {
    const startTime = Date.now();
    const cacheKey = this.generateSearchCacheKey(request);
    
    try {
      logInfo('Knowledge base search started', {
        componentName: 'KnowledgeBase',
        query: request.query.substring(0, 100),
        sourceType: request.sourceType,
        maxResults: request.maxResults
      });

      // Check cache first
      const cached = this.getCachedSearch(cacheKey);
      if (cached) {
        logInfo('Search cache hit', {
          componentName: 'KnowledgeBase',
          cacheKey,
          resultCount: cached.result.length
        });

        return cached.result;
      }

      // Build search query
      const searchQuery = this.buildSearchQuery(request);
      
      // Execute search
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          knowledge_sources!knowledge_base_source_id_fkey(
            id,
            title,
            source_type,
            url,
            author,
            publication_date,
            reliability_score,
            verification_status,
            citation_count,
            metadata
          )
        `)
        .or(searchQuery.orClause)
        .order('confidence_score', { ascending: false });

      if (error) throw new Error(`Search failed: ${error.message}`);

      const rawResults = data || [];
      
      // Apply filtering and post-processing
      const results = await this.postProcessSearchResults(rawResults, request);
      
      // Cache results
      this.cacheSearch(cacheKey, results);
      
      const processingTime = Date.now() - startTime;
      logInfo('Knowledge base search completed', {
        componentName: 'KnowledgeBase',
        query: request.query.substring(0, 100),
        resultCount: results.length,
        processingTime
      });

      return results;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'KnowledgeBase',
        query: request.query.substring(0, 100),
        searchType: 'source_search'
      });

      return this.createEmptySearchResult(request);
    }
  }

  /**
   * Integrate source with context
   */
  async integrateSource(request: SourceIntegrationRequest): Promise<SourceIntegrationResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Source integration started', {
        componentName: 'KnowledgeBase',
        sourceId: request.sourceId,
        userId: request.userId,
        integrationType: request.integrationType
      });

      // Fetch source details
      const source = await this.getSourceById(request.sourceId);
      if (!source) {
        throw new Error(`Source not found: ${request.sourceId}`);
      }

      // Perform integration based on type
      let integrationResult: SourceIntegrationResult;
      
      switch (request.integrationType) {
        case 'reference':
          integrationResult = await this.integrateAsReference(source, request);
          break;
        case 'citation':
          integrationResult = await this.integrateAsCitation(source, request);
          break;
        case 'cross_reference':
          integrationResult = await this.integrateAsCrossReference(source, request);
          break;
        case 'verification':
          integrationResult = await this.integrateAsVerification(source, request);
          break;
        default:
          throw new Error(`Unknown integration type: ${request.integrationType}`);
      }

      // Update citation count
      await this.incrementCitationCount(request.sourceId);
      
      // Log integration
      await this.logIntegrationEvent(request, integrationResult);
      
      const processingTime = Date.now() - startTime;
      logInfo('Source integration completed', {
        componentName: 'KnowledgeBase',
        sourceId: request.sourceId,
        integrationType: request.integrationType,
        processingTime,
        status: integrationResult.integrationStatus
      });

      return integrationResult;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'KnowledgeBase',
        sourceId: request.sourceId,
        integrationType: request.integrationType
      });

      return this.createFailedIntegrationResult(request, Date.now() - startTime);
    }
  }

  /**
   * Verify source credibility and content
   */
  async verifySource(sourceId: string, verificationType: 'content' | 'source' | 'cross_reference' | 'expert_review'): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Source verification started', {
        componentName: 'KnowledgeBase',
        sourceId,
        verificationType
      });

      const source = await this.getSourceById(sourceId);
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      let verificationResult: VerificationResult;

      switch (verificationType) {
        case 'content':
          verificationResult = await this.verifyContent(source);
          break;
        case 'source':
          verificationResult = await this.verifySourceCredibility(source);
          break;
        case 'cross_reference':
          verificationResult = await this.verifyThroughCrossReference(source);
          break;
        case 'expert_review':
          verificationResult = await this.verifyThroughExpertReview(source);
          break;
        default:
          throw new Error(`Unknown verification type: ${verificationType}`);
      }

      // Update source verification status if needed
      if (verificationResult.status === 'verified' && source.verificationStatus !== 'verified') {
        await this.updateSourceVerificationStatus(sourceId, 'verified', verificationResult.verifier);
      } else if (verificationResult.status === 'disputed' && source.verificationStatus !== 'disputed') {
        await this.updateSourceVerificationStatus(sourceId, 'disputed');
      }

      // Log verification
      await this.logVerificationEvent(sourceId, verificationResult);
      
      const processingTime = Date.now() - startTime;
      logInfo('Source verification completed', {
        componentName: 'KnowledgeBase',
        sourceId,
        verificationType,
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        processingTime
      });

      return verificationResult;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'KnowledgeBase',
        sourceId,
        verificationType
      });

      return this.createFailedVerificationResult(sourceId, verificationType, Date.now() - startTime);
    }
  }

  /**
   * Find cross-references and related sources
   */
  async findCrossReferences(sourceId: string, maxReferences: number = 5): Promise<CrossReferenceResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Cross-reference search started', {
        componentName: 'KnowledgeBase',
        sourceId,
        maxReferences
      });

      const source = await this.getSourceById(sourceId);
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      // Find related sources by topics
      const topicRelated = await this.findTopicRelatedSources(source, Math.ceil(maxReferences / 2));
      
      // Find related sources by content similarity
      const contentRelated = await this.findContentRelatedSources(source, Math.ceil(maxReferences / 2));
      
      // Combine and deduplicate
      const allRelated = [...topicRelated, ...contentRelated];
      const uniqueRelated = this.deduplicateSources(allRelated);
      
      // Analyze relationships
      const relatedSources = await Promise.all(
        uniqueRelated.slice(0, maxReferences).map(async (related) => ({
          source: related,
          relationshipType: await this.determineRelationshipType(source, related),
          strength: await this.calculateRelationshipStrength(source, related),
          evidence: await this.findRelationshipEvidence(source, related)
        }))
      );

      // Calculate consensus score
      const consensusScore = this.calculateConsensusScore(source, relatedSources);
      
      // Identify conflicts
      const conflicts = await this.identifyConflicts(source, relatedSources);
      
      // Generate recommendations
      const recommendations = this.generateCrossReferenceRecommendations(source, relatedSources, conflicts);

      const processingTime = Date.now() - startTime;
      logInfo('Cross-reference search completed', {
        componentName: 'KnowledgeBase',
        sourceId,
        relatedCount: relatedSources.length,
        conflictCount: conflicts.length,
        consensusScore,
        processingTime
      });

      return {
        sourceId,
        relatedSources,
        consensusScore,
        conflicts,
        recommendations
      };

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'KnowledgeBase',
        sourceId,
        operation: 'cross_reference_search'
      });

      return this.createEmptyCrossReferenceResult(sourceId);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(): Promise<KnowledgeBaseStats> {
    try {
      // Get basic counts
      const { count: totalSources } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

      const { count: verifiedSources } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verified');

      const { count: pendingSources } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      const { count: disputedSources } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'disputed');

      // Calculate average reliability
      const { data: reliabilityData } = await supabase
        .from('knowledge_base')
        .select('reliability_score')
        .not('reliability_score', 'is', null);

      const averageReliability = reliabilityData && Array.isArray(reliabilityData) && reliabilityData.length > 0
        ? reliabilityData.reduce((sum, item) => {
            const score = (item as any).reliability_score;
            return sum + (typeof score === 'number' ? score : 0);
          }, 0) / reliabilityData.length
        : 0;

      // Get total citations
      const { data: citationData } = await supabase
        .from('knowledge_sources')
        .select('citation_count')
        .not('citation_count', 'is', null);

      const totalCitations = citationData && Array.isArray(citationData)
        ? citationData.reduce((sum, item) => {
            const count = (item as any).citation_count;
            return sum + (typeof count === 'number' ? count : 0);
          }, 0)
        : 0;

      // Get sources by type
      const { data: typeData } = await supabase
        .from('knowledge_base')
        .select('fact_type');

      const sourcesByFactType = (typeData && Array.isArray(typeData) ? typeData : []).reduce((acc, item) => {
        const type = (item as any).fact_type as FactType || 'fact';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<FactType, number>);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: newSources } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: newVerifications } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verified')
        .gte('verified_at', sevenDaysAgo.toISOString());

      return {
        totalSources: totalSources || 0,
        verifiedSources: verifiedSources || 0,
        pendingVerification: pendingSources || 0,
        disputedSources: disputedSources || 0,
        averageReliability: Math.round(averageReliability * 100) / 100,
        totalCitations,
        sourcesByType: {
          knowledge_base: sourcesByFactType.fact || 0,
          knowledge_sources: sourcesByFactType.fact || 0,
          user_profile: sourcesByFactType.example || 0,
          conversation_history: sourcesByFactType.opinion || 0,
          external_api: sourcesByFactType.definition || 0,
          educational_resource: sourcesByFactType.procedure || 0
        },
        sourcesByFactType,
        recentActivity: {
          newSources: newSources || 0,
          verifications: newVerifications || 0,
          disputes: 0, // Would need dispute tracking
          citations: 0 // Would need citation tracking
        }
      };

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'KnowledgeBase',
        operation: 'get_stats'
      });

      return this.createEmptyStats();
    }
  }

  /**
   * Private helper methods
   */

  private buildSearchQuery(request: SourceSearchRequest): { orClause: string } {
    const conditions: string[] = [];
    const params: any[] = [];

    // Text search in content and title
    if (request.query) {
      conditions.push(`content.ilike.%${request.query}%`);
      conditions.push(`knowledge_sources(title).ilike.%${request.query}%`);
    }

    // Source type filter
    if (request.sourceType) {
      conditions.push(`knowledge_sources(source_type).eq.${request.sourceType}`);
    }

    // Fact type filter
    if (request.factType) {
      conditions.push(`fact_type.eq.${request.factType}`);
    }

    // Verification status filter
    if (request.verificationStatus) {
      conditions.push(`knowledge_sources(verification_status).eq.${request.verificationStatus}`);
    }

    // Reliability score filter
    if (request.minReliability) {
      conditions.push(`confidence_score.gte.${request.minReliability}`);
    }

    // Topics filter
    if (request.topics && request.topics.length > 0) {
      const topicConditions = request.topics.map(topic => `topics.cs.{${topic}}`).join(',');
      conditions.push(`or(${topicConditions})`);
    }

    // Time range filter
    if (request.timeRange?.start) {
      conditions.push(`created_at.gte.${request.timeRange.start.toISOString()}`);
    }
    if (request.timeRange?.end) {
      conditions.push(`created_at.lte.${request.timeRange.end.toISOString()}`);
    }

    const orClause = conditions.length > 0 ? conditions.join(',') : 'id.not.is.null';
    
    return { orClause };
  }

  private async postProcessSearchResults(rawResults: any[], request: SourceSearchRequest): Promise<SourceSearchResult[]> {
    const results: SourceSearchResult[] = [];

    for (const raw of rawResults) {
      try {
        const source = this.mapRawToKnowledgeSource(raw);
        
        // Calculate relevance score
        const relevanceScore = this.calculateRelevanceScore(source, request.query);
        
        // Apply relevance threshold
        if (request.relevanceThreshold && relevanceScore < request.relevanceThreshold) {
          continue;
        }

        // Find matches
        const matches = this.findSearchMatches(source, request.query);
        
        // Create context
        const context = this.createSourceContext(source, matches);
        
        results.push({
          source,
          relevanceScore,
          matches,
          context
        });

      } catch (error) {
        logWarning('Failed to process search result', {
          componentName: 'KnowledgeBase',
          sourceId: raw?.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Sort by relevance and apply limit
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results.slice(0, request.maxResults || KnowledgeBase.MAX_SEARCH_RESULTS);
  }

  private mapRawToKnowledgeSource(raw: any): KnowledgeSource {
    const source = raw.knowledge_sources;
    
    return {
      id: raw.id,
      title: source?.title || 'Untitled Source',
      sourceType: (source?.source_type as SourceType) || 'knowledge_base',
      url: source?.url,
      author: source?.author,
      publicationDate: source?.publication_date ? new Date(source.publication_date) : undefined,
      reliabilityScore: source?.reliability_score || 0,
      verificationStatus: (source?.verification_status as VerificationStatus) || 'pending',
      citationCount: source?.citation_count || 0,
      metadata: source?.metadata || {},
      content: raw.content,
      contentHash: raw.content_hash,
      topics: raw.topics || [],
      factType: (raw.fact_type as FactType) || 'fact',
      confidenceScore: raw.confidence_score || 0,
      verifiedAt: raw.verified_at ? new Date(raw.verified_at) : undefined,
      verifiedBy: raw.verified_by,
      lastUpdated: new Date(raw.last_updated),
      createdAt: new Date(raw.created_at)
    };
  }

  private calculateRelevanceScore(source: KnowledgeSource, query: string): number {
    if (!query) return 0.5;

    const queryWords = query.toLowerCase().split(/\s+/);
    const content = source.content.toLowerCase();
    const title = source.title.toLowerCase();
    
    let score = 0;
    let maxScore = 0;

    // Title matches (higher weight)
    for (const word of queryWords) {
      if (title.includes(word)) {
        score += 0.3;
      }
      maxScore += 0.3;
    }

    // Content matches
    for (const word of queryWords) {
      if (content.includes(word)) {
        score += 0.1;
      }
      maxScore += 0.1;
    }

    // Topic matches
    for (const topic of source.topics) {
      for (const word of queryWords) {
        if (topic.toLowerCase().includes(word)) {
          score += 0.2;
        }
        maxScore += 0.2;
      }
    }

    // Normalize to 0-1
    return maxScore > 0 ? Math.min(1, score / maxScore) : 0;
  }

  private findSearchMatches(source: KnowledgeSource, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Title matches
    for (const word of queryWords) {
      const titleIndex = source.title.toLowerCase().indexOf(word);
      if (titleIndex !== -1) {
        matches.push({
          field: 'title',
          snippet: source.title.substring(Math.max(0, titleIndex - 20), titleIndex + word.length + 20),
          highlight: this.createHighlight(source.title, word),
          confidence: 0.9
        });
      }
    }

    // Content matches
    const content = source.content.toLowerCase();
    for (const word of queryWords) {
      const contentIndex = content.indexOf(word);
      if (contentIndex !== -1) {
        const originalContent = source.content;
        const snippet = originalContent.substring(Math.max(0, contentIndex - 50), contentIndex + word.length + 50);
        matches.push({
          field: 'content',
          snippet,
          highlight: this.createHighlight(snippet, word),
          confidence: 0.7
        });
      }
    }

    return matches.slice(0, 5); // Limit matches
  }

  private createHighlight(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**');
  }

  private createSourceContext(source: KnowledgeSource, matches: SearchMatch[]): string {
    const contextParts: string[] = [];
    
    if (matches.length > 0) {
      contextParts.push(`Found in ${matches.length} sections: ${matches.map(m => m.field).join(', ')}`);
    }
    
    if (source.topics.length > 0) {
      contextParts.push(`Topics: ${source.topics.slice(0, 3).join(', ')}`);
    }
    
    if (source.verificationStatus === 'verified') {
      contextParts.push('Verification: Verified');
    } else if (source.reliabilityScore > 0.7) {
      contextParts.push('High reliability source');
    }

    return contextParts.join(' • ');
  }

  // Integration methods
  private async integrateAsReference(source: KnowledgeSource, request: SourceIntegrationRequest): Promise<SourceIntegrationResult> {
    return {
      integrationId: this.generateIntegrationId(),
      source,
      integrationStatus: 'success',
      recommendations: [
        'Source referenced for credibility',
        'Consider citing in response'
      ],
      context: `Referenced: ${source.title}`,
      processingTime: 0
    };
  }

  private async integrateAsCitation(source: KnowledgeSource, request: SourceIntegrationRequest): Promise<SourceIntegrationResult> {
    return {
      integrationId: this.generateIntegrationId(),
      source,
      integrationStatus: 'success',
      recommendations: [
        'Add formal citation in response',
        'Include reliability score in analysis'
      ],
      context: `Cited: ${source.title} (${source.reliabilityScore} reliability)`,
      processingTime: 0
    };
  }

  private async integrateAsCrossReference(source: KnowledgeSource, request: SourceIntegrationRequest): Promise<SourceIntegrationResult> {
    const crossRefs = await this.findCrossReferences(source.id, 3);
    
    return {
      integrationId: this.generateIntegrationId(),
      source,
      integrationStatus: 'success',
      verificationResults: [],
      recommendations: [
        'Cross-reference with related sources',
        `Found ${crossRefs.relatedSources.length} related sources`
      ],
      context: `Cross-referenced: ${source.title}`,
      processingTime: 0
    };
  }

  private async integrateAsVerification(source: KnowledgeSource, request: SourceIntegrationRequest): Promise<SourceIntegrationResult> {
    const verification = await this.verifySource(source.id, 'content');
    
    return {
      integrationId: this.generateIntegrationId(),
      source,
      integrationStatus: verification.status === 'verified' ? 'success' : 'partial',
      verificationResults: [verification],
      recommendations: [
        `Verification status: ${verification.status}`,
        `Confidence: ${(verification.confidence * 100).toFixed(1)}%`
      ],
      context: `Verified: ${source.title}`,
      processingTime: 0
    };
  }

  // Verification methods
  private async verifyContent(source: KnowledgeSource): Promise<VerificationResult> {
    // Simple content verification based on structure and completeness
    const hasStructure = source.content.includes('.') || source.content.includes('\n');
    const hasSubstance = source.content.length > 100;
    const isWellFormed = /[a-zA-Z]/.test(source.content);

    const confidence = (hasStructure ? 0.3 : 0) + (hasSubstance ? 0.4 : 0) + (isWellFormed ? 0.3 : 0);
    
    return {
      sourceId: source.id,
      verificationType: 'content',
      status: confidence > 0.7 ? 'verified' : confidence > 0.4 ? 'inconclusive' : 'disputed',
      confidence,
      evidence: [
        hasStructure ? 'Content has proper structure' : 'Content lacks structure',
        hasSubstance ? 'Content has sufficient substance' : 'Content is too brief',
        isWellFormed ? 'Content is well-formed' : 'Content may be corrupted'
      ],
      issues: confidence < 0.7 ? ['Content quality below threshold'] : [],
      verifier: 'automated_content_checker',
      verifiedAt: new Date()
    };
  }

  private async verifySourceCredibility(source: KnowledgeSource): Promise<VerificationResult> {
    const reliabilityScore = source.reliabilityScore;
    const hasAuthor = !!source.author;
    const hasPublicationDate = !!source.publicationDate;
    const hasUrl = !!source.url;

    const confidence = (reliabilityScore * 0.5) + (hasAuthor ? 0.2 : 0) + (hasPublicationDate ? 0.2 : 0) + (hasUrl ? 0.1 : 0);
    
    return {
      sourceId: source.id,
      verificationType: 'source',
      status: confidence > 0.6 ? 'verified' : confidence > 0.3 ? 'inconclusive' : 'disputed',
      confidence,
      evidence: [
        `Reliability score: ${reliabilityScore}`,
        hasAuthor ? 'Author provided' : 'No author information',
        hasPublicationDate ? 'Publication date available' : 'No publication date',
        hasUrl ? 'URL available' : 'No URL provided'
      ],
      issues: confidence < 0.6 ? ['Source credibility below threshold'] : [],
      verifier: 'automated_credibility_checker',
      verifiedAt: new Date()
    };
  }

  private async verifyThroughCrossReference(source: KnowledgeSource): Promise<VerificationResult> {
    const crossRefs = await this.findCrossReferences(source.id, 5);
    const supportingSources = crossRefs.relatedSources.filter(r => r.relationshipType === 'supports');
    const contradictingSources = crossRefs.relatedSources.filter(r => r.relationshipType === 'contradicts');

    const confidence = Math.max(0, (supportingSources.length * 0.2) - (contradictingSources.length * 0.3));
    
    return {
      sourceId: source.id,
      verificationType: 'cross_reference',
      status: confidence > 0.4 ? 'verified' : confidence > 0.1 ? 'inconclusive' : 'disputed',
      confidence,
      evidence: [
        `${supportingSources.length} supporting sources found`,
        `${contradictingSources.length} contradicting sources found`,
        `Consensus score: ${crossRefs.consensusScore.toFixed(2)}`
      ],
      issues: contradictingSources.length > 0 ? ['Contradicting sources identified'] : [],
      verifier: 'cross_reference_validator',
      verifiedAt: new Date()
    };
  }

  private async verifyThroughExpertReview(source: KnowledgeSource): Promise<VerificationResult> {
    // This would integrate with expert review system
    // For now, return a placeholder
    return {
      sourceId: source.id,
      verificationType: 'expert_review',
      status: source.verificationStatus === 'verified' ? 'verified' : 'inconclusive',
      confidence: source.verificationStatus === 'verified' ? 0.8 : 0.3,
      evidence: ['Expert review system integration pending'],
      issues: source.verificationStatus !== 'verified' ? ['Awaiting expert review'] : [],
      verifier: 'expert_panel',
      verifiedAt: new Date()
    };
  }

  // Database helper methods
  private async getSourceById(sourceId: string): Promise<KnowledgeSource | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          knowledge_sources!knowledge_base_source_id_fkey(*)
        `)
        .eq('id', sourceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data ? this.mapRawToKnowledgeSource(data) : null;
    } catch (error) {
      logWarning('Failed to get source by ID', { sourceId, error });
      return null;
    }
  }

  private async incrementCitationCount(sourceId: string): Promise<void> {
    try {
      // First get the knowledge_sources record ID
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('source_id')
        .eq('id', sourceId)
        .single();

      if (kbError) throw kbError;

      const sourceIdFromKb = (kbData as any)?.source_id;
      if (!sourceIdFromKb) return;

      const { data: sourceData, error: sourceError } = await supabase
        .from('knowledge_sources')
        .select('citation_count')
        .eq('id', sourceIdFromKb)
        .single();

      if (sourceError) throw sourceError;

      const currentCount = (sourceData as any)?.citation_count || 0;
      
      await (supabase
        .from('knowledge_sources') as any)
        .update({ citation_count: currentCount + 1 })
        .eq('id', sourceIdFromKb);
        
    } catch (error) {
      logWarning('Failed to increment citation count', { sourceId, error });
    }
  }

  private async updateSourceVerificationStatus(sourceId: string, status: VerificationStatus, verifier?: string): Promise<void> {
    try {
      // Update knowledge_base table
      await (supabase
        .from('knowledge_base') as any)
        .update({
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          verified_by: verifier || null
        })
        .eq('id', sourceId);

      // Also update knowledge_sources table if it has verification status
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('source_id')
        .eq('id', sourceId)
        .single();

      const sourceIdFromKb = (kbData as any)?.source_id;
      if (sourceIdFromKb) {
        await (supabase
          .from('knowledge_sources') as any)
          .update({ verification_status: status })
          .eq('id', sourceIdFromKb);
      }
        
    } catch (error) {
      logWarning('Failed to update verification status', { sourceId, status, error });
    }
  }

  // Cross-reference helper methods
  private async findTopicRelatedSources(source: KnowledgeSource, maxResults: number): Promise<KnowledgeSource[]> {
    if (source.topics.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          knowledge_sources!knowledge_base_source_id_fkey(*)
        `)
        .or(source.topics.map(topic => `topics.cs.{${topic}}`).join(','))
        .neq('id', source.id)
        .order('confidence_score', { ascending: false })
        .limit(maxResults);

      if (error) throw error;

      return (data || []).map(item => this.mapRawToKnowledgeSource(item));
    } catch (error) {
      logWarning('Failed to find topic related sources', { sourceId: source.id, error });
      return [];
    }
  }

  private async findContentRelatedSources(source: KnowledgeSource, maxResults: number): Promise<KnowledgeSource[]> {
    try {
      // Simple content-based search (in real implementation, this would use vector similarity)
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          knowledge_sources!knowledge_base_source_id_fkey(*)
        `)
        .textSearch('content', source.content.substring(0, 100), { type: 'websearch' })
        .neq('id', source.id)
        .order('confidence_score', { ascending: false })
        .limit(maxResults);

      if (error) throw error;

      return (data || []).map(item => this.mapRawToKnowledgeSource(item));
    } catch (error) {
      logWarning('Failed to find content related sources', { sourceId: source.id, error });
      return [];
    }
  }

  private deduplicateSources(sources: KnowledgeSource[]): KnowledgeSource[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      if (seen.has(source.id)) {
        return false;
      }
      seen.add(source.id);
      return true;
    });
  }

  private async determineRelationshipType(source1: KnowledgeSource, source2: KnowledgeSource): Promise<'supports' | 'contradicts' | 'extends' | 'references'> {
    // Simple heuristic - in real implementation, this would use more sophisticated analysis
    const content1 = source1.content.toLowerCase();
    const content2 = source2.content.toLowerCase();
    
    if (content1.includes('however') || content2.includes('however')) {
      return 'contradicts';
    }
    
    if (content1.includes('moreover') || content2.includes('furthermore')) {
      return 'extends';
    }
    
    if (content1.includes(source2.title.toLowerCase()) || content2.includes(source1.title.toLowerCase())) {
      return 'references';
    }
    
    return 'supports';
  }

  private async calculateRelationshipStrength(source1: KnowledgeSource, source2: KnowledgeSource): Promise<number> {
    // Base strength on reliability scores
    const avgReliability = (source1.reliabilityScore + source2.reliabilityScore) / 2;
    
    // Adjust based on topic overlap
    const commonTopics = source1.topics.filter(topic => source2.topics.includes(topic));
    const topicOverlap = commonTopics.length / Math.max(source1.topics.length, source2.topics.length);
    
    return Math.min(1, (avgReliability * 0.7) + (topicOverlap * 0.3));
  }

  private async findRelationshipEvidence(source1: KnowledgeSource, source2: KnowledgeSource): Promise<string[]> {
    const evidence: string[] = [];
    
    // Topic overlap evidence
    const commonTopics = source1.topics.filter(topic => source2.topics.includes(topic));
    if (commonTopics.length > 0) {
      evidence.push(`Shared topics: ${commonTopics.join(', ')}`);
    }
    
    // Reliability evidence
    if (source1.reliabilityScore > 0.7 && source2.reliabilityScore > 0.7) {
      evidence.push('Both sources have high reliability scores');
    }
    
    return evidence;
  }

  private calculateConsensusScore(source: KnowledgeSource, relatedSources: any[]): number {
    if (relatedSources.length === 0) return 0.5;
    
    const supporting = relatedSources.filter(r => r.relationshipType === 'supports').length;
    const total = relatedSources.length;
    
    return total > 0 ? supporting / total : 0.5;
  }

  private async identifyConflicts(source: KnowledgeSource, relatedSources: any[]): Promise<any[]> {
    const conflicts = relatedSources
      .filter(r => r.relationshipType === 'contradicts')
      .map(r => ({
        conflictingSource: r.source,
        conflictType: 'contradiction' as const,
        description: `Source contradicts the main source's claims`
      }));
    
    return conflicts;
  }

  private generateCrossReferenceRecommendations(source: KnowledgeSource, relatedSources: any[], conflicts: any[]): string[] {
    const recommendations: string[] = [];
    
    if (relatedSources.length > 0) {
      recommendations.push(`Consider reviewing ${relatedSources.length} related sources for additional context`);
    }
    
    if (conflicts.length > 0) {
      recommendations.push(`Address ${conflicts.length} conflicting sources in analysis`);
    }
    
    if (source.verificationStatus !== 'verified') {
      recommendations.push('Source verification recommended for critical decisions');
    }
    
    return recommendations;
  }

  // Utility methods
  private generateSearchCacheKey(request: SourceSearchRequest): string {
    const keyData = {
      query: request.query,
      sourceType: request.sourceType,
      factType: request.factType,
      verificationStatus: request.verificationStatus,
      minReliability: request.minReliability,
      maxResults: request.maxResults,
      topics: request.topics?.sort()
    };
    
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  private getCachedSearch(cacheKey: string): { result: SourceSearchResult[], timestamp: Date, expiresAt: Date } | null {
    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt < new Date()) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private cacheSearch(cacheKey: string, results: SourceSearchResult[]): void {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.searchCache.set(cacheKey, {
      result: results,
      timestamp: new Date(),
      expiresAt
    });
  }

  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      for (const [key, cached] of this.searchCache.entries()) {
        if (cached.expiresAt < now) {
          this.searchCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logInfo('Search cache cleanup completed', {
          componentName: 'KnowledgeBase',
          entriesRemoved: cleaned,
          remainingEntries: this.searchCache.size
        });
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  // Error handling methods
  private createEmptySearchResult(request: SourceSearchRequest): SourceSearchResult[] {
    return [];
  }

  private createFailedIntegrationResult(request: SourceIntegrationRequest, processingTime: number): SourceIntegrationResult {
    return {
      integrationId: this.generateIntegrationId(),
      source: {} as KnowledgeSource,
      integrationStatus: 'failed',
      recommendations: ['Integration failed - manual review required'],
      context: 'Integration failed',
      processingTime
    };
  }

  private createFailedVerificationResult(sourceId: string, verificationType: string, processingTime: number): VerificationResult {
    return {
      sourceId,
      verificationType: verificationType as any,
      status: 'inconclusive',
      confidence: 0,
      evidence: ['Verification failed due to system error'],
      issues: ['Automated verification unavailable'],
      verifier: 'system_error',
      verifiedAt: new Date()
    };
  }

  private createEmptyCrossReferenceResult(sourceId: string): CrossReferenceResult {
    return {
      sourceId,
      relatedSources: [],
      consensusScore: 0.5,
      conflicts: [],
      recommendations: ['No cross-references found - verify source independently']
    };
  }

  private createEmptyStats(): KnowledgeBaseStats {
    return {
      totalSources: 0,
      verifiedSources: 0,
      pendingVerification: 0,
      disputedSources: 0,
      averageReliability: 0,
      totalCitations: 0,
      sourcesByType: {
        knowledge_base: 0,
        knowledge_sources: 0,
        user_profile: 0,
        conversation_history: 0,
        external_api: 0,
        educational_resource: 0
      },
      sourcesByFactType: {
        fact: 0,
        opinion: 0,
        hypothesis: 0,
        definition: 0,
        example: 0,
        procedure: 0
      },
      recentActivity: {
        newSources: 0,
        verifications: 0,
        disputes: 0,
        citations: 0
      }
    };
  }

  private generateIntegrationId(): string {
    return `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Logging methods
  private async logIntegrationEvent(request: SourceIntegrationRequest, result: SourceIntegrationResult): Promise<void> {
    try {
      await (supabase
        .from('context_optimization_logs') as any)
        .insert([{
          user_id: request.userId,
          query_hash: this.generateQueryHash(request.context),
          original_context: { type: 'source_integration', request },
          optimized_context: { type: 'source_integration', result },
          size_reduction: 0,
          relevance_score: 1.0,
          optimization_strategy: request.integrationType
        }]);
    } catch (error) {
      logWarning('Failed to log integration event', { error });
    }
  }

  private async logVerificationEvent(sourceId: string, result: VerificationResult): Promise<void> {
    try {
      await (supabase
        .from('quality_metrics') as any)
        .insert([{
          user_id: null,
          interaction_id: null,
          quality_score: result.confidence,
          hallucination_probability: 1 - result.confidence,
          anomaly_indicators: { verification_failed: result.status === 'disputed' },
          alerts_triggered: result.status === 'disputed' ? ['verification_dispute'] : [],
          monitoring_data: {
            source_id: sourceId,
            verification_type: result.verificationType,
            verifier: result.verifier
          }
        }]);
    } catch (error) {
      logWarning('Failed to log verification event', { error });
    }
  }

  private generateQueryHash(query: string): string {
    return createHash('md5').update(query + this.cryptoKey).digest('hex');
  }

  /**
   * Cleanup on instance destruction
   */
  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.searchCache.clear();
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBase();

// Convenience functions
export const searchKnowledgeBase = (request: SourceSearchRequest) => 
  knowledgeBase.searchSources(request);

export const integrateSource = (request: SourceIntegrationRequest) => 
  knowledgeBase.integrateSource(request);

export const verifySource = (sourceId: string, type: 'content' | 'source' | 'cross_reference' | 'expert_review') => 
  knowledgeBase.verifySource(sourceId, type);

export const findCrossReferences = (sourceId: string, maxReferences?: number) => 
  knowledgeBase.findCrossReferences(sourceId, maxReferences);

export const getKnowledgeBaseStats = () => 
  knowledgeBase.getKnowledgeBaseStats();