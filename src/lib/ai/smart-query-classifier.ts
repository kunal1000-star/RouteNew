// Smart Query Classification System
// ==================================
// Intelligent system to detect when queries need personalization vs general responses
// and automatically decide when web search is required

import { AdvancedPersonalizationEngine } from './advanced-personalization-engine';

export interface QueryClassificationRequest {
  query: string;
  userId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
    performance?: {
      accuracy: number;
      speed: number;
      engagement: number;
    };
    preferences?: {
      explanationDepth: 'basic' | 'intermediate' | 'advanced';
      interactionStyle: 'socratic' | 'direct' | 'interactive' | 'collaborative';
    };
  };
  sessionContext?: {
    subject?: string;
    topic?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    previousQueries?: string[];
    timeSpent?: number;
  };
}

export interface SmartClassificationResult {
  classification: {
    type: 'personalized' | 'general' | 'hybrid';
    confidence: number;
    reasoning: string[];
    factors: ClassificationFactor[];
  };
  webSearchDecision: {
    needed: boolean;
    type: 'academic' | 'general' | 'news' | 'current' | 'wikipedia';
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  };
  personalizationIndicators: {
    personalReferences: boolean;
    performanceQuestions: boolean;
    learningStyleMatch: boolean;
    historicalContext: boolean;
    progressTracking: boolean;
  };
  teachingAdaptation: {
    required: boolean;
    level: 'basic' | 'intermediate' | 'advanced';
    style: 'socratic' | 'direct' | 'interactive' | 'collaborative';
    examplesNeeded: boolean;
    feedbackLoops: string[];
  };
  memoryRelevance: {
    score: number;
    relevantMemories: Array<{
      type: string;
      relevance: number;
      content: string;
    }>;
  };
}

export interface ClassificationFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  evidence: string[];
}

export class SmartQueryClassifier {
  private personalizationEngine: AdvancedPersonalizationEngine;
  private personalKeywords: Set<string>;
  private webSearchKeywords: Set<string>;
  private academicKeywords: Set<string>;
  private performanceKeywords: Set<string>;

  constructor() {
    this.personalizationEngine = new AdvancedPersonalizationEngine();
    this.initializeKeywords();
  }

  /**
   * Main classification method
   */
  async classifyQuery(request: QueryClassificationRequest): Promise<SmartClassificationResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze query for personalization indicators
      const personalizationAnalysis = await this.analyzePersonalizationIndicators(request);
      
      // Step 2: Determine web search necessity
      const webSearchAnalysis = await this.analyzeWebSearchNeed(request, personalizationAnalysis);
      
      // Step 3: Assess teaching adaptation needs
      const teachingAnalysis = await this.analyzeTeachingNeeds(request, personalizationAnalysis);
      
      // Step 4: Evaluate memory relevance
      const memoryAnalysis = await this.analyzeMemoryRelevance(request);
      
      // Step 5: Calculate final classification
      const classification = this.calculateFinalClassification(personalizationAnalysis, webSearchAnalysis);
      
      // Step 6: Generate reasoning and factors
      const reasoning = this.generateReasoning(personalizationAnalysis, webSearchAnalysis, teachingAnalysis);
      const factors = this.calculateClassificationFactors(request, personalizationAnalysis, webSearchAnalysis);
      
      const processingTime = Date.now() - startTime;
      console.log(`Smart classification completed in ${processingTime}ms`, {
        type: classification.type,
        webSearchNeeded: webSearchAnalysis.needed,
        confidence: classification.confidence
      });

      return {
        classification,
        webSearchDecision: webSearchAnalysis,
        personalizationIndicators: personalizationAnalysis.indicators,
        teachingAdaptation: teachingAnalysis,
        memoryRelevance: memoryAnalysis
      };

    } catch (error) {
      console.error('Smart classification failed:', error);
      
      // Return safe default classification
      return this.getDefaultClassification();
    }
  }

  /**
   * Analyze personalization indicators in the query
   */
  private async analyzePersonalizationIndicators(request: QueryClassificationRequest): Promise<{
    indicators: {
      personalReferences: boolean;
      performanceQuestions: boolean;
      learningStyleMatch: boolean;
      historicalContext: boolean;
      progressTracking: boolean;
    };
    scores: {
      personalReferences: number;
      performanceQuestions: number;
      learningStyleMatch: number;
      historicalContext: number;
      progressTracking: number;
    };
    evidence: string[];
  }> {
    const query = request.query.toLowerCase();
    const indicators = {
      personalReferences: false,
      performanceQuestions: false,
      learningStyleMatch: false,
      historicalContext: false,
      progressTracking: false
    };
    
    const scores = {
      personalReferences: 0,
      performanceQuestions: 0,
      learningStyleMatch: 0,
      historicalContext: 0,
      progressTracking: 0
    };
    
    const evidence: string[] = [];

    // Check for personal references
    if (/\b(my|our|me|i|us)\b/i.test(request.query)) {
      indicators.personalReferences = true;
      scores.personalReferences = 0.8;
      evidence.push('Personal pronouns detected');
    }

    // Check for performance-related questions
    if (/\b(performance|progress|grade|score|improve|weak|strong|help me|how am i|my score)\b/i.test(request.query)) {
      indicators.performanceQuestions = true;
      scores.performanceQuestions = 0.9;
      evidence.push('Performance-related keywords detected');
    }

    // Check for learning style match
    if (request.userProfile?.learningStyle) {
      const learningStyleKeywords = this.getLearningStyleKeywords(request.userProfile.learningStyle);
      if (learningStyleKeywords.some(keyword => query.includes(keyword))) {
        indicators.learningStyleMatch = true;
        scores.learningStyleMatch = 0.6;
        evidence.push(`Learning style match: ${request.userProfile.learningStyle}`);
      }
    }

    // Check for historical context in conversation
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const recentQueries = request.conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-5)
        .map(msg => msg.content.toLowerCase());
      
      const contextOverlap = recentQueries.some(prevQuery => 
        this.calculateTextSimilarity(query, prevQuery) > 0.3
      );
      
      if (contextOverlap) {
        indicators.historicalContext = true;
        scores.historicalContext = 0.7;
        evidence.push('Similar context found in conversation history');
      }
    }

    // Check for progress tracking indicators
    if (/\b(last time|before|previously|earlier|next|continue|build on)\b/i.test(request.query)) {
      indicators.progressTracking = true;
      scores.progressTracking = 0.6;
      evidence.push('Progress tracking indicators detected');
    }

    return { indicators, scores, evidence };
  }

  /**
   * Analyze if web search is needed
   */
  private async analyzeWebSearchNeed(
    request: QueryClassificationRequest,
    personalizationAnalysis: any
  ): Promise<{
    needed: boolean;
    type: 'academic' | 'general' | 'news' | 'current' | 'wikipedia';
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  }> {
    const query = request.query.toLowerCase();
    
    // Check for time-sensitive information
    if (/\b(current|latest|recent|2024|2025|today|now|newest|update)\b/i.test(request.query)) {
      return {
        needed: true,
        type: 'current',
        reason: 'Time-sensitive information requested',
        urgency: 'high'
      };
    }

    // Check for academic/scientific queries
    if (/\b(research|study|scientific|paper|journal|academic|theory|principle|law)\b/i.test(request.query)) {
      return {
        needed: true,
        type: 'academic',
        reason: 'Academic information needed',
        urgency: 'medium'
      };
    }

    // Check for factual questions that need verification
    if (/\b(what is|define|definition|meaning|how many|when|where|who)\b/i.test(request.query)) {
      return {
        needed: true,
        type: 'general',
        reason: 'Factual question requiring verification',
        urgency: 'medium'
      };
    }

    // Check for current events
    if (/\b(news|event|happening|current|breaking)\b/i.test(request.query)) {
      return {
        needed: true,
        type: 'news',
        reason: 'Current events information requested',
        urgency: 'high'
      };
    }

    // Check for complex topics that benefit from web search
    if (request.query.length > 100 || personalizationAnalysis.scores.performanceQuestions > 0.5) {
      return {
        needed: true,
        type: 'general',
        reason: 'Complex query benefits from external sources',
        urgency: 'low'
      };
    }

    return {
      needed: false,
      type: 'general',
      reason: 'No web search needed',
      urgency: 'low'
    };
  }

  /**
   * Analyze teaching adaptation needs
   */
  private async analyzeTeachingNeeds(
    request: QueryClassificationRequest,
    personalizationAnalysis: any
  ): Promise<{
    required: boolean;
    level: 'basic' | 'intermediate' | 'advanced';
    style: 'socratic' | 'direct' | 'interactive' | 'collaborative';
    examplesNeeded: boolean;
    feedbackLoops: string[];
  }> {
    // Determine if teaching adaptation is needed
    const needsAdaptation = personalizationAnalysis.indicators.performanceQuestions || 
                           personalizationAnalysis.indicators.learningStyleMatch ||
                           personalizationAnalysis.scores.historicalContext > 0.5;

    // Determine appropriate level
    let level: 'basic' | 'intermediate' | 'advanced' = 'intermediate';
    if (request.userProfile?.performance) {
      if (request.userProfile.performance.accuracy < 0.6) {
        level = 'basic';
      } else if (request.userProfile.performance.accuracy > 0.8) {
        level = 'advanced';
      }
    }

    // Determine teaching style
    let style: 'socratic' | 'direct' | 'interactive' | 'collaborative' = 'collaborative';
    if (request.userProfile?.preferences?.interactionStyle) {
      style = request.userProfile.preferences.interactionStyle;
    } else if (/\b(understand|grasp|comprehend)\b/i.test(request.query)) {
      style = 'socratic';
    } else if (/\b(how to|steps|procedure)\b/i.test(request.query)) {
      style = 'direct';
    }

    // Check if examples are needed
    const examplesNeeded = level === 'basic' || 
                          /\b(example|instance|for instance|such as)\b/i.test(request.query);

    // Generate appropriate feedback loops
    const feedbackLoops = this.generateFeedbackLoops(style, level);

    return {
      required: needsAdaptation,
      level,
      style,
      examplesNeeded,
      feedbackLoops
    };
  }

  /**
   * Analyze memory relevance for personalization
   */
  private async analyzeMemoryRelevance(request: QueryClassificationRequest): Promise<{
    score: number;
    relevantMemories: Array<{
      type: string;
      relevance: number;
      content: string;
    }>;
  }> {
    // This would integrate with the actual memory system
    // For now, we'll simulate memory analysis
    
    const query = request.query.toLowerCase();
    const relevantMemories: Array<{
      type: string;
      relevance: number;
      content: string;
    }> = [];

    let relevanceScore = 0.0;

    // Check conversation history for relevant memories
    if (request.conversationHistory) {
      const userMessages = request.conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-10);

      for (const message of userMessages) {
        const similarity = this.calculateTextSimilarity(query, message.content.toLowerCase());
        if (similarity > 0.3) {
          relevantMemories.push({
            type: 'conversation',
            relevance: similarity,
            content: message.content.substring(0, 100) + '...'
          });
          relevanceScore = Math.max(relevanceScore, similarity);
        }
      }
    }

    return {
      score: relevanceScore,
      relevantMemories
    };
  }

  /**
   * Calculate final classification
   */
  private calculateFinalClassification(personalizationAnalysis: any, webSearchAnalysis: any): {
    type: 'personalized' | 'general' | 'hybrid';
    confidence: number;
    reasoning: string[];
    factors: ClassificationFactor[];
  } {
    const personalScore = Object.values(personalizationAnalysis.scores).reduce((a: number, b: number) => a + b, 0) / 
                         Object.keys(personalizationAnalysis.scores).length;
    
    const hasPersonalIndicators = Object.values(personalizationAnalysis.indicators).some(Boolean);
    
    let type: 'personalized' | 'general' | 'hybrid';
    let confidence: number;
    
    if (hasPersonalIndicators && personalScore > 0.6) {
      type = 'personalized';
      confidence = Math.min(0.95, personalScore + 0.2);
    } else if (hasPersonalIndicators && personalScore > 0.3) {
      type = 'hybrid';
      confidence = personalScore;
    } else {
      type = 'general';
      confidence = 1.0 - personalScore;
    }

    return {
      type,
      confidence,
      reasoning: personalizationAnalysis.evidence,
      factors: [] // Will be filled by calculateClassificationFactors
    };
  }

  /**
   * Generate reasoning for the classification
   */
  private generateReasoning(personalizationAnalysis: any, webSearchAnalysis: any, teachingAnalysis: any): string[] {
    const reasoning: string[] = [];

    if (personalizationAnalysis.evidence.length > 0) {
      reasoning.push(`Personalization indicators: ${personalizationAnalysis.evidence.join(', ')}`);
    }

    if (webSearchAnalysis.needed) {
      reasoning.push(`Web search needed: ${webSearchAnalysis.reason}`);
    }

    if (teachingAnalysis.required) {
      reasoning.push(`Teaching adaptation required: ${teachingAnalysis.style} style at ${teachingAnalysis.level} level`);
    }

    if (reasoning.length === 0) {
      reasoning.push('General query - no special handling needed');
    }

    return reasoning;
  }

  /**
   * Calculate classification factors
   */
  private calculateClassificationFactors(
    request: QueryClassificationRequest,
    personalizationAnalysis: any,
    webSearchAnalysis: any
  ): ClassificationFactor[] {
    const factors: ClassificationFactor[] = [];

    // Personal references factor
    factors.push({
      name: 'Personal References',
      weight: 0.3,
      score: personalizationAnalysis.scores.personalReferences,
      description: 'Presence of personal pronouns and references',
      evidence: personalizationAnalysis.indicators.personalReferences ? ['Personal pronouns found'] : []
    });

    // Performance questions factor
    factors.push({
      name: 'Performance Questions',
      weight: 0.4,
      score: personalizationAnalysis.scores.performanceQuestions,
      description: 'Questions about user performance or progress',
      evidence: personalizationAnalysis.indicators.performanceQuestions ? ['Performance keywords found'] : []
    });

    // Web search factor
    factors.push({
      name: 'Web Search Need',
      weight: 0.2,
      score: webSearchAnalysis.needed ? 1.0 : 0.0,
      description: 'Whether external information is required',
      evidence: webSearchAnalysis.needed ? [webSearchAnalysis.reason] : ['No external information needed']
    });

    // Learning style factor
    factors.push({
      name: 'Learning Style Match',
      weight: 0.1,
      score: personalizationAnalysis.scores.learningStyleMatch,
      description: 'Query matches user\'s learning style',
      evidence: personalizationAnalysis.indicators.learningStyleMatch ? ['Learning style alignment'] : []
    });

    return factors;
  }

  /**
   * Get default classification for error cases
   */
  private getDefaultClassification(): SmartClassificationResult {
    return {
      classification: {
        type: 'general',
        confidence: 0.0,
        reasoning: ['Classification error - defaulting to general'],
        factors: []
      },
      webSearchDecision: {
        needed: false,
        type: 'general',
        reason: 'Default classification',
        urgency: 'low'
      },
      personalizationIndicators: {
        personalReferences: false,
        performanceQuestions: false,
        learningStyleMatch: false,
        historicalContext: false,
        progressTracking: false
      },
      teachingAdaptation: {
        required: false,
        level: 'intermediate',
        style: 'collaborative',
        examplesNeeded: false,
        feedbackLoops: []
      },
      memoryRelevance: {
        score: 0.0,
        relevantMemories: []
      }
    };
  }

  /**
   * Initialize keyword sets
   */
  private initializeKeywords(): void {
    this.personalKeywords = new Set([
      'my', 'our', 'me', 'i', 'us', 'mine', 'ours', 'myself', 'ourselves'
    ]);

    this.webSearchKeywords = new Set([
      'current', 'latest', 'recent', '2024', '2025', 'today', 'newest', 'update',
      'research', 'study', 'scientific', 'paper', 'journal', 'academic'
    ]);

    this.academicKeywords = new Set([
      'research', 'study', 'scientific', 'theory', 'principle', 'law', 'hypothesis',
      'evidence', 'data', 'analysis', 'paper', 'journal', 'academic'
    ]);

    this.performanceKeywords = new Set([
      'performance', 'progress', 'grade', 'score', 'improve', 'weak', 'strong',
      'help me', 'how am i', 'my score', 'better', 'worse'
    ]);
  }

  /**
   * Get learning style keywords
   */
  private getLearningStyleKeywords(style: string): string[] {
    const styleKeywords = {
      visual: ['see', 'look', 'visual', 'picture', 'diagram', 'chart', 'image'],
      auditory: ['hear', 'listen', 'audio', 'sound', 'music', 'verbal'],
      kinesthetic: ['touch', 'feel', 'hands-on', 'physical', 'practice', 'do'],
      reading_writing: ['read', 'write', 'text', 'book', 'document', 'notes']
    };

    return styleKeywords[style as keyof typeof styleKeywords] || [];
  }

  /**
   * Calculate text similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate feedback loops based on teaching style and level
   */
  private generateFeedbackLoops(style: string, level: string): string[] {
    const loops: string[] = [];

    switch (style) {
      case 'socratic':
        loops.push('What do you think about this approach?');
        loops.push('Can you explain this in your own words?');
        break;
      case 'interactive':
        loops.push('Try applying this to a problem you know');
        loops.push('What examples can you think of?');
        break;
      case 'collaborative':
        loops.push('Let\'s work through this together');
        loops.push('How does this connect to what you already know?');
        break;
      case 'direct':
        loops.push('Does this explanation make sense?');
        loops.push('Would you like me to go over any part again?');
        break;
    }

    if (level === 'basic') {
      loops.push('Let me know if any part is confusing');
    }

    return loops;
  }
}

// Export singleton instance
export const smartQueryClassifier = new SmartQueryClassifier();