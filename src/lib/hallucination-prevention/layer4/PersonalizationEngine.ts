// Layer 4: PersonalizationEngine
// ================================

import { Database } from '@/lib/database.types';

export interface LearningStyle {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  strength: number; // 0-1 scale
  preferences: {
    contentFormats: string[];
    interactionTypes: string[];
    difficultyProgression: 'gradual' | 'steep' | 'mixed';
    feedbackFrequency: 'immediate' | 'session_end' | 'periodic';
  };
  adaptationHistory: {
    adaptations: number;
    successfulChanges: number;
    lastAdaptation: Date;
  };
}

export interface PersonalizationProfile {
  userId: string;
  learningStyle: LearningStyle;
  performanceMetrics: {
    overallAccuracy: number;
    subjectPerformance: Record<string, {
      accuracy: number;
      speed: number;
      improvement: number;
      lastActivity: Date;
    }>;
    sessionPatterns: {
      averageSessionLength: number;
      peakLearningHours: string[];
      preferredSessionLength: number;
      breakFrequency: number;
    };
  };
  adaptationHistory: {
    lastAdaptation: Date;
    adaptationCount: number;
    successfulAdaptations: number;
    adaptationTypes: Array<{
      type: string;
      date: Date;
      success: number; // 0-1 scale
      impact: string;
    }>;
  };
  preferences: {
    responseStyle: 'concise' | 'detailed' | 'step_by_step' | 'interactive';
    explanationDepth: 'basic' | 'intermediate' | 'advanced';
    examplePreference: 'abstract' | 'concrete' | 'real_world';
    interactionPreference: 'socratic' | 'direct' | 'collaborative';
  };
  effectivePatterns: {
    successfulStrategies: string[];
    learningTriggers: string[];
    motivationFactors: string[];
    studyMethods: Array<{
      method: string;
      effectiveness: number;
      context: string;
    }>;
  };
}

export interface PersonalizationRequest {
  userId: string;
  currentSession: {
    query: string;
    response: string;
    context: any;
    performance?: {
      responseTime: number;
      accuracy: number;
      engagement: number;
    };
  };
  sessionHistory: Array<{
    query: string;
    response: string;
    timestamp: Date;
    performance?: {
      responseTime: number;
      accuracy: number;
      engagement: number;
      satisfaction: number;
    };
  }>;
  currentProfile?: PersonalizationProfile;
}

export interface PersonalizationResult {
  recommendations: {
    contentStyle: string[];
    responseFormat: string;
    difficultyAdjustment: number;
    interactionStyle: string;
    learningTriggers: string[];
  };
  adaptations: {
    immediate: Array<{
      type: string;
      change: any;
      rationale: string;
    }>;
    future: Array<{
      type: string;
      suggestion: string;
      trigger: string;
      expectedImpact: number;
    }>;
  };
  patternAnalysis: {
    newPatterns: string[];
    patternStrength: number;
    confidenceInAdaptations: number;
  };
  effectiveness: {
    predictedImprovement: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendedTesting: string[];
  };
}

export class PersonalizationEngine {
  private db: Database;
  private adaptationWeights = {
    learningStyle: 0.3,
    performance: 0.25,
    sessionPatterns: 0.2,
    effectiveStrategies: 0.15,
    feedbackHistory: 0.1
  };

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Analyze user patterns and generate personalization recommendations
   */
  async personalizeStudyExperience(request: PersonalizationRequest): Promise<PersonalizationResult> {
    try {
      // Get or create personalization profile
      const profile = await this.getOrCreateProfile(request.userId, request.currentProfile);

      // Analyze current session performance
      const sessionAnalysis = await this.analyzeCurrentSession(request.currentSession, profile);

      // Generate personalization recommendations
      const recommendations = this.generateRecommendations(profile, sessionAnalysis);

      // Create adaptation strategies
      const adaptations = this.createAdaptationStrategies(profile, sessionAnalysis);

      // Analyze learning patterns
      const patternAnalysis = this.analyzeLearningPatterns(request.sessionHistory, profile);

      // Assess effectiveness
      const effectiveness = this.assessEffectiveness(recommendations, adaptations, profile);

      // Update profile with new insights
      await this.updateProfileWithInsights(profile, sessionAnalysis, patternAnalysis);

      return {
        recommendations,
        adaptations,
        patternAnalysis,
        effectiveness
      };
    } catch (error) {
      console.error('PersonalizationEngine error:', error);
      throw error;
    }
  }

  /**
   * Get or create personalization profile for user
   */
  private async getOrCreateProfile(userId: string, existingProfile?: PersonalizationProfile): Promise<PersonalizationProfile> {
    if (existingProfile) {
      return existingProfile;
    }

    // Try to load from database
    const { data: existingData } = await this.db
      .from('personalization_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingData) {
      return this.mapDatabaseProfileToInterface(existingData);
    }

    // Create new profile based on initial interactions
    return this.createInitialProfile(userId);
  }

  /**
   * Create initial personalization profile
   */
  private createInitialProfile(userId: string): PersonalizationProfile {
    return {
      userId,
      learningStyle: {
        type: 'reading_writing', // Default assumption
        strength: 0.5,
        preferences: {
          contentFormats: ['text', 'explanation'],
          interactionTypes: ['chat', 'questions'],
          difficultyProgression: 'gradual',
          feedbackFrequency: 'session_end'
        },
        adaptationHistory: {
          adaptations: 0,
          successfulChanges: 0,
          lastAdaptation: new Date()
        }
      },
      performanceMetrics: {
        overallAccuracy: 0.7,
        subjectPerformance: {},
        sessionPatterns: {
          averageSessionLength: 15, // minutes
          peakLearningHours: ['14:00', '15:00', '16:00'],
          preferredSessionLength: 20,
          breakFrequency: 0.3
        }
      },
      adaptationHistory: {
        lastAdaptation: new Date(),
        adaptationCount: 0,
        successfulAdaptations: 0,
        adaptationTypes: []
      },
      preferences: {
        responseStyle: 'detailed',
        explanationDepth: 'intermediate',
        examplePreference: 'concrete',
        interactionPreference: 'collaborative'
      },
      effectivePatterns: {
        successfulStrategies: [],
        learningTriggers: [],
        motivationFactors: [],
        studyMethods: []
      }
    };
  }

  /**
   * Analyze current session for learning patterns
   */
  private async analyzeCurrentSession(session: PersonalizationRequest['currentSession'], profile: PersonalizationProfile) {
    const analysis = {
      queryComplexity: this.analyzeQueryComplexity(session.query),
      responseEffectiveness: this.assessResponseEffectiveness(session.response, session.performance),
      engagementLevel: session.performance?.engagement || 0.5,
      learningIndicators: this.identifyLearningIndicators(session.query, session.response),
      adaptationNeeds: this.identifyAdaptationNeeds(session.performance, profile)
    };

    return analysis;
  }

  /**
   * Generate personalization recommendations
   */
  private generateRecommendations(profile: PersonalizationProfile, sessionAnalysis: any) {
    const recommendations = {
      contentStyle: this.getRecommendedContentStyle(profile, sessionAnalysis),
      responseFormat: this.getRecommendedResponseFormat(profile),
      difficultyAdjustment: this.calculateDifficultyAdjustment(sessionAnalysis),
      interactionStyle: this.getRecommendedInteractionStyle(profile),
      learningTriggers: this.identifyLearningTriggers(sessionAnalysis, profile)
    };

    return recommendations;
  }

  /**
   * Create adaptation strategies based on analysis
   */
  private createAdaptationStrategies(profile: PersonalizationProfile, sessionAnalysis: any) {
    const adaptations = {
      immediate: this.generateImmediateAdaptations(sessionAnalysis, profile),
      future: this.generateFutureAdaptations(sessionAnalysis, profile)
    };

    return adaptations;
  }

  /**
   * Analyze learning patterns from session history
   */
  private analyzeLearningPatterns(sessionHistory: PersonalizationRequest['sessionHistory'], profile: PersonalizationProfile) {
    const patterns = {
      newPatterns: this.identifyNewPatterns(sessionHistory, profile),
      patternStrength: this.calculatePatternStrength(sessionHistory),
      confidenceInAdaptations: this.calculateAdaptationConfidence(sessionHistory, profile)
    };

    return patterns;
  }

  /**
   * Assess effectiveness of personalization recommendations
   */
  private assessEffectiveness(recommendations: any, adaptations: any, profile: PersonalizationProfile) {
    return {
      predictedImprovement: this.calculatePredictedImprovement(recommendations, adaptations, profile),
      riskLevel: this.assessAdaptationRisk(recommendations, profile),
      recommendedTesting: this.getTestingRecommendations(recommendations, profile)
    };
  }

  // Helper methods for analysis
  private analyzeQueryComplexity(query: string): number {
    const words = query.split(' ').length;
    const questions = (query.match(/\?/g) || []).length;
    const technicalTerms = (query.match(/[A-Z]{2,}/g) || []).length;
    
    return Math.min(1, (words + questions * 2 + technicalTerms * 3) / 20);
  }

  private assessResponseEffectiveness(response: string, performance?: any): number {
    const length = response.length;
    const structure = response.includes('1.') || response.includes('•') ? 1 : 0;
    const engagement = performance?.engagement || 0.5;
    
    return Math.min(1, (length / 500 + structure + engagement) / 3);
  }

  private identifyLearningIndicators(query: string, response: string): string[] {
    const indicators = [];
    
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('why')) {
      indicators.push('curiosity_driven');
    }
    
    if (response.includes('example') || response.includes('instance')) {
      indicators.push('example_seeking');
    }
    
    if (query.toLowerCase().includes('step') || query.toLowerCase().includes('process')) {
      indicators.push('process_oriented');
    }

    return indicators;
  }

  private identifyAdaptationNeeds(performance: any, profile: PersonalizationProfile): string[] {
    const needs = [];
    
    if (performance?.accuracy < 0.6) {
      needs.push('difficulty_adjustment');
    }
    
    if (performance?.engagement < 0.4) {
      needs.push('engagement_boost');
    }
    
    if (performance?.responseTime > 10000) { // 10 seconds
      needs.push('response_optimization');
    }

    return needs;
  }

  // Pattern recognition methods
  private identifyNewPatterns(sessionHistory: PersonalizationRequest['sessionHistory'], profile: PersonalizationProfile): string[] {
    const newPatterns = [];
    
    // Analyze recent sessions for new patterns
    const recentSessions = sessionHistory.slice(-10);
    
    // Look for timing patterns
    const hourCounts: Record<string, number> = {};
    recentSessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours().toString();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts).reduce((a, b) => 
      hourCounts[a[0]] > hourCounts[b[0]] ? a : b
    );
    
    if (peakHour[1] > 3) {
      newPatterns.push(`peak_learning_hour_${peakHour[0]}`);
    }

    return newPatterns;
  }

  private calculatePatternStrength(sessionHistory: PersonalizationRequest['sessionHistory']): number {
    if (sessionHistory.length < 5) return 0.3;
    
    // Calculate consistency in session patterns
    const recentSessions = sessionHistory.slice(-10);
    const hourConsistency = this.calculateHourConsistency(recentSessions);
    const queryTypeConsistency = this.calculateQueryTypeConsistency(recentSessions);
    
    return (hourConsistency + queryTypeConsistency) / 2;
  }

  private calculateAdaptationConfidence(sessionHistory: PersonalizationRequest['sessionHistory'], profile: PersonalizationProfile): number {
    const baseConfidence = 0.5;
    const dataPoints = Math.min(sessionHistory.length / 10, 1); // 0-1 based on data availability
    const historicalSuccess = profile.adaptationHistory.successfulAdaptations / 
      Math.max(profile.adaptationHistory.adaptationCount, 1);
    
    return Math.min(1, baseConfidence + dataPoints * 0.3 + historicalSuccess * 0.2);
  }

  // Helper methods
  private calculateHourConsistency(sessions: any[]): number {
    const hours = sessions.map(s => new Date(s.timestamp).getHours());
    const hourCounts: Record<number, number> = {};
    
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(hourCounts));
    return maxCount / sessions.length;
  }

  private calculateQueryTypeConsistency(sessions: any[]): number {
    const types = sessions.map(s => this.classifyQueryType(s.query));
    const typeCounts: Record<string, number> = {};
    
    types.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(typeCounts));
    return maxCount / sessions.length;
  }

  private classifyQueryType(query: string): string {
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('step')) {
      return 'procedural';
    } else if (query.toLowerCase().includes('why') || query.toLowerCase().includes('because')) {
      return 'conceptual';
    } else if (query.toLowerCase().includes('what') || query.toLowerCase().includes('define')) {
      return 'definitional';
    } else {
      return 'exploratory';
    }
  }

  // Update profile with new insights
  private async updateProfileWithInsights(profile: PersonalizationProfile, sessionAnalysis: any, patternAnalysis: any): Promise<void> {
    // Update adaptation count and last adaptation time
    profile.adaptationHistory.lastAdaptation = new Date();
    profile.adaptationHistory.adaptationCount++;

    // Add new adaptation type
    if (sessionAnalysis.adaptationNeeds.length > 0) {
      profile.adaptationHistory.adaptationTypes.push({
        type: sessionAnalysis.adaptationNeeds[0],
        date: new Date(),
        success: sessionAnalysis.responseEffectiveness,
        impact: 'session_based'
      });

      if (sessionAnalysis.responseEffectiveness > 0.6) {
        profile.adaptationHistory.successfulAdaptations++;
      }
    }

    // Update learning triggers
    patternAnalysis.newPatterns.forEach((pattern: string) => {
      if (!profile.effectivePatterns.learningTriggers.includes(pattern)) {
        profile.effectivePatterns.learningTriggers.push(pattern);
      }
    });

    // Update performance metrics
    if (sessionAnalysis.responseEffectiveness > profile.performanceMetrics.overallAccuracy) {
      profile.performanceMetrics.overallAccuracy = sessionAnalysis.responseEffectiveness;
    }
  }

  // Getter methods for recommendations
  private getRecommendedContentStyle(profile: PersonalizationProfile, sessionAnalysis: any): string[] {
    const styles = [];
    
    if (profile.learningStyle.type === 'visual') {
      styles.push('diagrams', 'charts', 'visual_examples');
    } else if (profile.learningStyle.type === 'auditory') {
      styles.push('verbal_explanations', 'discussion_points');
    } else if (profile.learningStyle.type === 'kinesthetic') {
      styles.push('hands_on_examples', 'practical_applications');
    } else {
      styles.push('text_based', 'written_summaries');
    }

    return styles;
  }

  private getRecommendedResponseFormat(profile: PersonalizationProfile): string {
    return profile.preferences.responseStyle;
  }

  private calculateDifficultyAdjustment(sessionAnalysis: any): number {
    if (sessionAnalysis.adaptationNeeds.includes('difficulty_adjustment')) {
      return sessionAnalysis.queryComplexity > 0.7 ? -0.2 : 0.1;
    }
    return 0;
  }

  private getRecommendedInteractionStyle(profile: PersonalizationProfile): string {
    return profile.preferences.interactionPreference;
  }

  private identifyLearningTriggers(sessionAnalysis: any, profile: PersonalizationProfile): string[] {
    const triggers = [...profile.effectivePatterns.learningTriggers];
    
    sessionAnalysis.learningIndicators.forEach((indicator: string) => {
      if (!triggers.includes(indicator)) {
        triggers.push(indicator);
      }
    });

    return triggers;
  }

  // Generate immediate and future adaptations
  private generateImmediateAdaptations(sessionAnalysis: any, profile: PersonalizationProfile) {
    const adaptations = [];
    
    if (sessionAnalysis.adaptationNeeds.includes('difficulty_adjustment')) {
      adaptations.push({
        type: 'difficulty',
        change: sessionAnalysis.queryComplexity > 0.7 ? 'decrease' : 'maintain',
        rationale: 'Current performance suggests optimal difficulty level'
      });
    }

    return adaptations;
  }

  private generateFutureAdaptations(sessionAnalysis: any, profile: PersonalizationProfile) {
    const adaptations = [];
    
    if (sessionAnalysis.engagementLevel < 0.5) {
      adaptations.push({
        type: 'engagement',
        suggestion: 'Add interactive elements to responses',
        trigger: 'low_engagement_score',
        expectedImpact: 0.2
      });
    }

    return adaptations;
  }

  // Assessment methods
  private calculatePredictedImprovement(recommendations: any, adaptations: any, profile: PersonalizationProfile): number {
    let improvement = 0;
    
    if (adaptations.immediate.length > 0) {
      improvement += 0.1;
    }
    
    if (profile.learningStyle.strength < 0.7) {
      improvement += 0.15;
    }
    
    return Math.min(0.4, improvement);
  }

  private assessAdaptationRisk(recommendations: any, profile: PersonalizationProfile): 'low' | 'medium' | 'high' {
    if (profile.adaptationHistory.successfulAdaptations / profile.adaptationHistory.adaptationCount > 0.7) {
      return 'low';
    } else if (profile.adaptationHistory.successfulAdaptations / profile.adaptationHistory.adaptationCount > 0.4) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private getTestingRecommendations(recommendations: any, profile: PersonalizationProfile): string[] {
    const tests = [];
    
    if (recommendations.difficultyAdjustment !== 0) {
      tests.push('monitor_difficulty_response');
    }
    
    if (profile.learningStyle.strength < 0.5) {
      tests.push('validate_learning_style_assessment');
    }

    return tests;
  }

  // Database mapping
  private mapDatabaseProfileToInterface(dbData: any): PersonalizationProfile {
    return {
      userId: dbData.user_id,
      learningStyle: {
        type: dbData.learning_style_type,
        strength: dbData.learning_style_strength,
        preferences: {
          contentFormats: dbData.content_formats || [],
          interactionTypes: dbData.interaction_types || [],
          difficultyProgression: dbData.difficulty_progression || 'gradual',
          feedbackFrequency: dbData.feedback_frequency || 'session_end'
        },
        adaptationHistory: {
          adaptations: dbData.adaptation_count || 0,
          successfulChanges: dbData.successful_adaptations || 0,
          lastAdaptation: new Date(dbData.last_adaptation)
        }
      },
      performanceMetrics: {
        overallAccuracy: dbData.overall_accuracy || 0.7,
        subjectPerformance: dbData.subject_performance || {},
        sessionPatterns: {
          averageSessionLength: dbData.avg_session_length || 15,
          peakLearningHours: dbData.peak_hours || [],
          preferredSessionLength: dbData.preferred_session_length || 20,
          breakFrequency: dbData.break_frequency || 0.3
        }
      },
      adaptationHistory: {
        lastAdaptation: new Date(dbData.last_adaptation),
        adaptationCount: dbData.adaptation_count || 0,
        successfulAdaptations: dbData.successful_adaptations || 0,
        adaptationTypes: dbData.adaptation_types || []
      },
      preferences: {
        responseStyle: dbData.response_style || 'detailed',
        explanationDepth: dbData.explanation_depth || 'intermediate',
        examplePreference: dbData.example_preference || 'concrete',
        interactionPreference: dbData.interaction_preference || 'collaborative'
      },
      effectivePatterns: {
        successfulStrategies: dbData.successful_strategies || [],
        learningTriggers: dbData.learning_triggers || [],
        motivationFactors: dbData.motivation_factors || [],
        studyMethods: dbData.study_methods || []
      }
    };
  }
}