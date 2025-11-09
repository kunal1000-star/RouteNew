// User Feedback Collection System for Error Handling
// =================================================

import { LayerError } from './enhanced-error-handler';
import { errorMonitoring } from './error-monitoring';

export interface UserFeedback {
  id: string;
  timestamp: string;
  correlationId: string;
  userId?: string;
  sessionId: string;
  conversationId: string;
  layer: number;
  errorId?: string;
  type: 'error_report' | 'improvement_suggestion' | 'satisfaction_rating' | 'bug_report' | 'feature_request';
  rating?: number; // 1-5 scale
  category: 'accuracy' | 'performance' | 'usability' | 'reliability' | 'features';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  deviceInfo?: string;
  attachments?: string[];
  tags: string[];
  assignedTo?: string;
  resolution?: string;
  resolutionTime?: number;
  userSatisfaction?: number;
  metadata: Record<string, any>;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  averageResolutionTime: number;
  userSatisfactionScore: number;
  topIssues: Array<{
    issue: string;
    count: number;
    impact: string;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  resolutionRate: number;
  feedbackTrends: {
    period: string;
    feedbackCount: number;
    satisfactionScore: number;
    commonThemes: string[];
  }[];
}

export interface FeedbackContext {
  userId?: string;
  sessionId: string;
  conversationId: string;
  currentPage: string;
  userAgent: string;
  timestamp: string;
  errorContext?: {
    layer: number;
    errorType: string;
    correlationId: string;
  };
  userPreferences: {
    language: string;
    timezone: string;
    accessibility: {
      screenReader: boolean;
      highContrast: boolean;
      reducedMotion: boolean;
    };
  };
}

class UserFeedbackSystem {
  private feedback: Map<string, UserFeedback> = new Map();
  private feedbackQueue: string[] = [];
  private maxFeedbackItems = 5000;
  private analyticsCache: FeedbackAnalytics | null = null;
  private lastAnalyticsUpdate = 0;
  private analyticsUpdateInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startPeriodicAnalyticsUpdate();
  }

  /**
   * Submit user feedback
   */
  submitFeedback(
    feedbackData: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>,
    context: FeedbackContext
  ): string {
    const feedbackId = this.generateFeedbackId();
    const timestamp = new Date().toISOString();
    
    const feedback: UserFeedback = {
      ...feedbackData,
      id: feedbackId,
      timestamp,
      status: 'new',
      metadata: {
        ...feedbackData.metadata,
        context,
        submittedVia: this.determineSubmissionMethod(context),
        userJourney: this.trackUserJourney(context)
      }
    };

    // Store feedback
    this.feedback.set(feedbackId, feedback);
    this.feedbackQueue.push(feedbackId);

    // Log to monitoring system
    this.logFeedbackToMonitoring(feedback, context);

    // Process feedback based on type
    this.processFeedbackByType(feedback);

    // Clean up old feedback
    this.cleanupOldFeedback();

    // Trigger analytics update if needed
    this.updateAnalyticsIfNeeded();

    return feedbackId;
  }

  /**
   * Submit error report with enhanced context
   */
  submitErrorReport(
    error: LayerError,
    context: FeedbackContext,
    additionalDetails: {
      userDescription?: string;
      stepsBeforeError?: string;
      expectedBehavior?: string;
      actualBehavior?: string;
      impact?: 'minor' | 'major' | 'critical';
    } = {}
  ): string {
    return this.submitFeedback({
      correlationId: error.correlationId,
      userId: context.userId,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      layer: error.layer,
      errorId: error.correlationId,
      type: 'error_report',
      category: this.mapErrorToCategory(error),
      priority: this.mapErrorToPriority(error),
      title: `Error in ${error.layerName}: ${error.message.substring(0, 50)}...`,
      description: additionalDetails.userDescription || error.userFriendlyMessage,
      stepsToReproduce: additionalDetails.stepsBeforeError,
      expectedBehavior: additionalDetails.expectedBehavior,
      actualBehavior: additionalDetails.actualBehavior || error.technicalDetails,
      browserInfo: context.userAgent,
      tags: this.generateErrorTags(error),
      metadata: {
        errorCorrelationId: error.correlationId,
        errorImpact: error.impact,
        errorRecoverable: error.recoverable,
        errorRecoveryAttempts: error.recoveryAttempts,
        ...additionalDetails
      }
    }, context);
  }

  /**
   * Submit satisfaction rating
   */
  submitSatisfactionRating(
    correlationId: string,
    rating: number,
    context: FeedbackContext,
    comment?: string
  ): string {
    return this.submitFeedback({
      correlationId,
      userId: context.userId,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      layer: 0, // System-wide rating
      type: 'satisfaction_rating',
      category: 'usability',
      priority: rating <= 2 ? 'high' : rating <= 3 ? 'medium' : 'low',
      title: `User Satisfaction Rating: ${rating}/5`,
      description: comment || 'No additional comments provided',
      rating,
      tags: ['satisfaction', 'rating', `score_${rating}`],
      metadata: {
        rating,
        comment,
        ratedAt: context.timestamp
      }
    }, context);
  }

  /**
   * Submit improvement suggestion
   */
  submitImprovementSuggestion(
    suggestion: string,
    context: FeedbackContext,
    category: UserFeedback['category'] = 'features',
    priority: UserFeedback['priority'] = 'medium'
  ): string {
    return this.submitFeedback({
      correlationId: `suggestion-${Date.now()}`,
      userId: context.userId,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      layer: 0,
      type: 'improvement_suggestion',
      category,
      priority,
      title: 'User Improvement Suggestion',
      description: suggestion,
      tags: ['improvement', 'suggestion', category],
      metadata: {
        suggestionType: 'general',
        submittedVia: 'feedback_form'
      }
    }, context);
  }

  /**
   * Get feedback by ID
   */
  getFeedback(feedbackId: string): UserFeedback | null {
    return this.feedback.get(feedbackId) || null;
  }

  /**
   * Get feedback by correlation ID
   */
  getFeedbackByCorrelation(correlationId: string): UserFeedback[] {
    return Array.from(this.feedback.values())
      .filter(f => f.correlationId === correlationId);
  }

  /**
   * Get feedback by user ID
   */
  getFeedbackByUser(userId: string): UserFeedback[] {
    return Array.from(this.feedback.values())
      .filter(f => f.userId === userId);
  }

  /**
   * Update feedback status
   */
  updateFeedbackStatus(
    feedbackId: string,
    status: UserFeedback['status'],
    assignedTo?: string,
    resolution?: string
  ): boolean {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return false;

    feedback.status = status;
    if (assignedTo) feedback.assignedTo = assignedTo;
    if (resolution) feedback.resolution = resolution;
    
    // Calculate resolution time if resolving
    if (status === 'resolved' && !feedback.resolutionTime) {
      const created = new Date(feedback.timestamp).getTime();
      const resolved = new Date().getTime();
      feedback.resolutionTime = resolved - created;
    }

    // Update analytics cache
    this.invalidateAnalyticsCache();

    return true;
  }

  /**
   * Get feedback analytics
   */
  getAnalytics(timeRange?: { start: Date; end: Date }): FeedbackAnalytics {
    this.updateAnalyticsIfNeeded();
    
    if (this.analyticsCache && !timeRange) {
      return this.analyticsCache;
    }

    const feedback = timeRange 
      ? Array.from(this.feedback.values()).filter(f => {
          const feedbackTime = new Date(f.timestamp);
          return feedbackTime >= timeRange.start && feedbackTime <= timeRange.end;
        })
      : Array.from(this.feedback.values());

    return this.calculateAnalytics(feedback);
  }

  /**
   * Get feedback trends
   */
  getFeedbackTrends(period: 'day' | 'week' | 'month' = 'week'): Array<{
    period: string;
    feedbackCount: number;
    satisfactionScore: number;
    commonThemes: string[];
  }> {
    const now = new Date();
    const periods: Array<{ start: Date; end: Date; label: string }> = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      const end = new Date(now);
      
      switch (period) {
        case 'day':
          start.setDate(start.getDate() - i);
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - i);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start.setDate(start.getDate() - (i * 7));
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - (i * 7));
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start.setMonth(start.getMonth() - i);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setMonth(end.getMonth() - i);
          end.setDate(0); // Last day of previous month
          end.setHours(23, 59, 59, 999);
          break;
      }
      
      periods.push({
        start,
        end,
        label: start.toLocaleDateString()
      });
    }

    return periods.map(period => {
      const periodFeedback = Array.from(this.feedback.values()).filter(f => {
        const feedbackTime = new Date(f.timestamp);
        return feedbackTime >= period.start && feedbackTime <= period.end;
      });

      const satisfactionRatings = periodFeedback
        .filter(f => f.rating)
        .map(f => f.rating!) as number[];

      const satisfactionScore = satisfactionRatings.length > 0
        ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
        : 0;

      const commonThemes = this.extractCommonThemes(periodFeedback);

      return {
        period: period.label,
        feedbackCount: periodFeedback.length,
        satisfactionScore,
        commonThemes
      };
    });
  }

  /**
   * Private helper methods
   */
  private generateFeedbackId(): string {
    return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSubmissionMethod(context: FeedbackContext): string {
    // Determine how the feedback was submitted
    if (context.errorContext) {
      return 'error_report';
    } else if (context.currentPage.includes('feedback')) {
      return 'feedback_form';
    } else {
      return 'inline_widget';
    }
  }

  private trackUserJourney(context: FeedbackContext): string[] {
    // Track user journey based on context
    const journey: string[] = [];
    
    if (context.errorContext) {
      journey.push('error_encountered');
    }
    
    if (context.currentPage.includes('chat')) {
      journey.push('chat_interaction');
    }
    
    if (context.currentPage.includes('dashboard')) {
      journey.push('dashboard_view');
    }
    
    return journey;
  }

  private logFeedbackToMonitoring(feedback: UserFeedback, context: FeedbackContext): void {
    // Log feedback submission to monitoring system
    errorMonitoring.logEvent({
      type: 'info',
      correlationId: feedback.correlationId,
      layer: feedback.layer,
      severity: feedback.priority === 'critical' ? 'critical' : feedback.priority === 'high' ? 'high' : 'low',
      message: `User feedback submitted: ${feedback.type}`,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      userId: context.userId,
      source: 'client',
      metadata: {
        feedbackType: feedback.type,
        feedbackCategory: feedback.category,
        feedbackPriority: feedback.priority,
        hasRating: !!feedback.rating
      }
    });
  }

  private processFeedbackByType(feedback: UserFeedback): void {
    switch (feedback.type) {
      case 'error_report':
        this.handleErrorReport(feedback);
        break;
      case 'satisfaction_rating':
        this.handleSatisfactionRating(feedback);
        break;
      case 'improvement_suggestion':
        this.handleImprovementSuggestion(feedback);
        break;
    }
  }

  private handleErrorReport(feedback: UserFeedback): void {
    // Auto-assign critical error reports
    if (feedback.priority === 'critical') {
      feedback.assignedTo = 'error-handling-system';
      feedback.status = 'acknowledged';
    }

    // Tag error reports for analysis
    feedback.tags.push('auto_processed');
  }

  private handleSatisfactionRating(feedback: UserFeedback): void {
    // Trigger follow-up for low ratings
    if (feedback.rating && feedback.rating <= 2) {
      feedback.priority = 'high';
      feedback.tags.push('low_satisfaction', 'follow_up_required');
    }

    // Update user satisfaction metrics
    feedback.tags.push('satisfaction_data');
  }

  private handleImprovementSuggestion(feedback: UserFeedback): void {
    // Route suggestions to appropriate teams
    const categoryRoutes = {
      'features': 'product-team',
      'usability': 'ux-team',
      'performance': 'engineering-team',
      'accuracy': 'ai-team',
      'reliability': 'devops-team'
    };

    const assignedTeam = categoryRoutes[feedback.category];
    if (assignedTeam) {
      feedback.assignedTo = assignedTeam;
    }

    feedback.tags.push('improvement_request');
  }

  private mapErrorToCategory(error: LayerError): UserFeedback['category'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('accuracy') || message.includes('fact') || message.includes('correct')) {
      return 'accuracy';
    } else if (message.includes('slow') || message.includes('timeout') || message.includes('performance')) {
      return 'performance';
    } else if (message.includes('confusing') || message.includes('unclear') || message.includes('ui')) {
      return 'usability';
    } else if (message.includes('crash') || message.includes('fail') || message.includes('error')) {
      return 'reliability';
    } else {
      return 'features';
    }
  }

  private mapErrorToPriority(error: LayerError): UserFeedback['priority'] {
    switch (error.impact) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }

  private generateErrorTags(error: LayerError): string[] {
    const tags = [`layer_${error.layer}`, error.impact, 'error'];
    
    if (error.recoverable) {
      tags.push('recoverable');
    }
    
    if (error.recoveryAttempts > 0) {
      tags.push('recovery_attempted');
    }
    
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('validation')) tags.push('validation');
    if (message.includes('network')) tags.push('network');
    if (message.includes('database')) tags.push('database');
    
    return tags;
  }

  private calculateAnalytics(feedback: UserFeedback[]): FeedbackAnalytics {
    const totalFeedback = feedback.length;
    
    const byType = this.groupBy(feedback, 'type');
    const byCategory = this.groupBy(feedback, 'category');
    const byPriority = this.groupBy(feedback, 'priority');
    const byStatus = this.groupBy(feedback, 'status');
    
    const resolvedFeedback = feedback.filter(f => f.status === 'resolved');
    const averageResolutionTime = resolvedFeedback.length > 0
      ? resolvedFeedback.reduce((sum, f) => sum + (f.resolutionTime || 0), 0) / resolvedFeedback.length
      : 0;
    
    const satisfactionRatings = feedback
      .filter(f => f.rating)
      .map(f => f.rating!) as number[];
    
    const userSatisfactionScore = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;
    
    const resolutionRate = totalFeedback > 0
      ? (resolvedFeedback.length / totalFeedback) * 100
      : 0;
    
    const topIssues = this.identifyTopIssues(feedback);
    const feedbackTrends = this.getFeedbackTrends('week');

    return {
      totalFeedback,
      byType,
      byCategory,
      byPriority,
      byStatus,
      averageResolutionTime,
      userSatisfactionScore,
      topIssues,
      resolutionRate,
      feedbackTrends
    };
  }

  private identifyTopIssues(feedback: UserFeedback[]): Array<{
    issue: string;
    count: number;
    impact: string;
    trend: 'increasing' | 'stable' | 'decreasing';
  }> {
    const issueCounts = new Map<string, { count: number; priorities: string[] }>();
    
    feedback.forEach(f => {
      const issue = f.title;
      const existing = issueCounts.get(issue) || { count: 0, priorities: [] };
      existing.count++;
      existing.priorities.push(f.priority);
      issueCounts.set(issue, existing);
    });
    
    return Array.from(issueCounts.entries())
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        impact: data.priorities.includes('critical') ? 'High' : 
                data.priorities.includes('high') ? 'Medium' : 'Low',
        trend: 'stable' as const // Simplified - would analyze historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractCommonThemes(feedback: UserFeedback[]): string[] {
    const themes = new Map<string, number>();
    
    feedback.forEach(f => {
      f.tags.forEach(tag => {
        themes.set(tag, (themes.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private updateAnalyticsIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastAnalyticsUpdate > this.analyticsUpdateInterval) {
      this.analyticsCache = this.calculateAnalytics(Array.from(this.feedback.values()));
      this.lastAnalyticsUpdate = now;
    }
  }

  private invalidateAnalyticsCache(): void {
    this.analyticsCache = null;
    this.lastAnalyticsUpdate = 0;
  }

  private startPeriodicAnalyticsUpdate(): void {
    setInterval(() => {
      this.updateAnalyticsIfNeeded();
    }, this.analyticsUpdateInterval);
  }

  private cleanupOldFeedback(): void {
    if (this.feedback.size > this.maxFeedbackItems) {
      const sortedEntries = Array.from(this.feedback.entries())
        .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
      
      const toDelete = sortedEntries.slice(0, this.feedback.size - this.maxFeedbackItems);
      toDelete.forEach(([id]) => {
        this.feedback.delete(id);
        const queueIndex = this.feedbackQueue.indexOf(id);
        if (queueIndex > -1) {
          this.feedbackQueue.splice(queueIndex, 1);
        }
      });
    }
  }
}

// Export singleton instance
export const userFeedbackSystem = new UserFeedbackSystem();

// Export helper functions
export function submitErrorReport(
  error: LayerError,
  context: FeedbackContext,
  additionalDetails?: any
): string {
  return userFeedbackSystem.submitErrorReport(error, context, additionalDetails);
}

export function submitSatisfactionRating(
  correlationId: string,
  rating: number,
  context: FeedbackContext,
  comment?: string
): string {
  return userFeedbackSystem.submitSatisfactionRating(correlationId, rating, context, comment);
}

export function submitImprovementSuggestion(
  suggestion: string,
  context: FeedbackContext,
  category?: UserFeedback['category'],
  priority?: UserFeedback['priority']
): string {
  return userFeedbackSystem.submitImprovementSuggestion(suggestion, context, category, priority);
}

export function getFeedbackAnalytics(timeRange?: { start: Date; end: Date }) {
  return userFeedbackSystem.getAnalytics(timeRange);
}

export function getFeedbackTrends(period?: 'day' | 'week' | 'month') {
  return userFeedbackSystem.getFeedbackTrends(period);
}