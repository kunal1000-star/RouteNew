// Layer 5: RealTimeMonitor - Real-time Study Session Monitoring
// ============================================================

import type { StudyBuddyApiRequest, StudyBuddyApiResponse, StudyEffectivenessMetrics } from '@/types/study-buddy';
import { aiServiceManager } from '../ai/ai-service-manager-unified';

// Real-time monitoring types
export interface StudySession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'interrupted';
  metrics: StudySessionMetrics;
  healthStatus: SessionHealthStatus;
  events: StudySessionEvent[];
  context: StudySessionContext;
}

export interface StudySessionMetrics {
  totalMessages: number;
  responseTime: number[];
  accuracyScore: number;
  engagementScore: number;
  learningVelocity: number;
  errorRate: number;
  satisfactionScore: number;
  contextSwitches: number;
  focusTime: number;
  breakTime: number;
  topicsCovered: number;
  questionsAsked: number;
  correctionsMade: number;
}

export interface SessionHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  aiProviders: Record<string, { healthy: boolean; responseTime: number; lastCheck: Date }>;
  sessionQuality: number;
  systemLoad: number;
  errorCount: number;
  warnings: string[];
  criticalIssues: string[];
}

export interface StudySessionEvent {
  id: string;
  timestamp: Date;
  type: 'message_sent' | 'message_received' | 'error' | 'warning' | 'performance_issue' | 'quality_drop' | 'engagement_change' | 'break_taken' | 'topic_switched';
  severity: 'info' | 'warning' | 'error' | 'critical';
  data: any;
  description: string;
}

export interface StudySessionContext {
  subject: string;
  difficulty: string;
  learningGoals: string[];
  sessionType: 'practice' | 'review' | 'exploration' | 'assessment';
  userProfile: {
    learningStyle: string;
    experienceLevel: string;
    preferences: Record<string, any>;
  };
  environment: {
    deviceType: string;
    browserType: string;
    networkQuality: string;
    timeZone: string;
  };
}

// Real-time monitoring request types
export interface MonitoringRequest {
  sessionId: string;
  operation: 'start_monitoring' | 'update_metrics' | 'check_health' | 'generate_alert' | 'end_session';
  data?: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number;
}

export interface MonitoringResponse {
  sessionId: string;
  success: boolean;
  data?: any;
  monitoringData: {
    sessionStatus: StudySession['status'];
    healthUpdate: Partial<SessionHealthStatus>;
    metrics: Partial<StudySessionMetrics>;
    alerts: MonitoringAlert[];
    recommendations: string[];
  };
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'quality' | 'engagement' | 'technical' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  actionRequired: boolean;
  suggestedActions: string[];
}

// Performance monitoring types
export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    messagesPerMinute: number;
    requestsPerSecond: number;
  };
  quality: {
    accuracyScore: number;
    relevanceScore: number;
    satisfactionScore: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    providerResponseTimes: Record<string, number>;
  };
}

export class RealTimeMonitor {
  private activeSessions = new Map<string, StudySession>();
  private sessionMetrics = new Map<string, StudySessionMetrics>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: Map<string, (alert: MonitoringAlert) => void> = new Map();
  private maxSessionHistory = 1000;
  private monitoringFrequency = 5000; // 5 seconds

  constructor() {
    this.startRealTimeMonitoring();
  }

  /**
   * Start monitoring a study session
   */
  async monitorStudySession(sessionId: string, userId: string, context: StudySessionContext): Promise<MonitoringResponse> {
    try {
      // Create new session
      const session: StudySession = {
        sessionId,
        userId,
        startTime: new Date(),
        status: 'active',
        metrics: this.initializeSessionMetrics(),
        healthStatus: this.initializeHealthStatus(),
        events: [],
        context
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      this.sessionMetrics.set(sessionId, session.metrics);

      // Log session start event
      await this.logSessionEvent(sessionId, {
        type: 'message_sent',
        severity: 'info',
        data: { event: 'session_started', userId, context },
        description: 'Study session started'
      });

      // Perform initial health check
      const healthCheck = await this.performSessionHealthCheck(sessionId);

      return {
        sessionId,
        success: true,
        data: session,
        monitoringData: {
          sessionStatus: session.status,
          healthUpdate: healthCheck,
          metrics: session.metrics,
          alerts: [],
          recommendations: this.generateInitialRecommendations(context)
        }
      };

    } catch (error) {
      return {
        sessionId,
        success: false,
        error: {
          code: 'MONITORING_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start session monitoring',
          recoverable: true
        },
        monitoringData: {
          sessionStatus: 'interrupted',
          healthUpdate: {},
          metrics: {},
          alerts: [],
          recommendations: []
        }
      };
    }
  }

  /**
   * Update session metrics in real-time
   */
  async updateSessionMetrics(sessionId: string, updateData: Partial<StudySessionMetrics>): Promise<MonitoringResponse> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Update metrics
      const currentMetrics = this.sessionMetrics.get(sessionId) || this.initializeSessionMetrics();
      const updatedMetrics = { ...currentMetrics, ...updateData };
      
      // Update specific metric calculations
      if (updateData.responseTime) {
        updatedMetrics.responseTime = [...currentMetrics.responseTime, ...updateData.responseTime];
      }

      this.sessionMetrics.set(sessionId, updatedMetrics);
      session.metrics = updatedMetrics;

      // Check for alerts
      const alerts = await this.checkForAlerts(sessionId, updatedMetrics);

      // Update health status
      const healthUpdate = await this.updateSessionHealth(sessionId, updatedMetrics, alerts);

      return {
        sessionId,
        success: true,
        data: { metrics: updatedMetrics, health: healthUpdate },
        monitoringData: {
          sessionStatus: session.status,
          healthUpdate,
          metrics: updatedMetrics,
          alerts,
          recommendations: this.generateMetricBasedRecommendations(updatedMetrics)
        }
      };

    } catch (error) {
      return {
        sessionId,
        success: false,
        error: {
          code: 'METRICS_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update session metrics',
          recoverable: true
        },
        monitoringData: {
          sessionStatus: 'interrupted',
          healthUpdate: {},
          metrics: {},
          alerts: [],
          recommendations: []
        }
      };
    }
  }

  /**
   * Perform real-time session health check
   */
  async performSessionHealthCheck(sessionId: string): Promise<Partial<SessionHealthStatus>> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const metrics = this.sessionMetrics.get(sessionId) || this.initializeSessionMetrics();
      
      // Check AI provider health
      const providerHealth = await this.checkAIProviderHealth();
      
      // Calculate session quality score
      const sessionQuality = this.calculateSessionQuality(metrics);
      
      // Check for warnings and critical issues
      const warnings: string[] = [];
      const criticalIssues: string[] = [];
      
      // Performance warnings
      if (metrics.errorRate > 0.1) {
        warnings.push(`High error rate detected: ${(metrics.errorRate * 100).toFixed(1)}%`);
      }
      
      if (metrics.responseTime.length > 0) {
        const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
        if (avgResponseTime > 5000) {
          warnings.push(`Slow response times detected: ${avgResponseTime.toFixed(0)}ms average`);
        }
      }
      
      // Engagement warnings
      if (metrics.engagementScore < 0.5) {
        warnings.push('Low engagement score detected');
      }
      
      // Critical issues
      const healthyProviders = Object.values(providerHealth).filter(p => p.healthy).length;
      if (healthyProviders === 0) {
        criticalIssues.push('All AI providers are unavailable');
      }
      
      if (metrics.errorRate > 0.3) {
        criticalIssues.push('Critical error rate threshold exceeded');
      }

      // Determine overall health
      let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalIssues.length > 0) {
        overall = 'critical';
      } else if (warnings.length > 0) {
        overall = 'warning';
      }

      const healthStatus: Partial<SessionHealthStatus> = {
        overall,
        aiProviders: providerHealth,
        sessionQuality,
        systemLoad: await this.getCurrentSystemLoad(),
        errorCount: Math.floor(metrics.errorRate * metrics.totalMessages),
        warnings,
        criticalIssues
      };

      // Update session health status
      session.healthStatus = { ...session.healthStatus, ...healthStatus };

      return healthStatus;

    } catch (error) {
      console.error(`Health check failed for session ${sessionId}:`, error);
      return {
        overall: 'critical',
        criticalIssues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * End monitoring for a study session
   */
  async endSessionMonitoring(sessionId: string): Promise<MonitoringResponse> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Update session end time
      session.endTime = new Date();
      session.status = 'completed';

      // Calculate final metrics
      const finalMetrics = this.sessionMetrics.get(sessionId);
      if (finalMetrics) {
        // Calculate effectiveness metrics
        const effectiveness = this.calculateStudyEffectiveness(finalMetrics, session);
        
        // Log session end event
        await this.logSessionEvent(sessionId, {
          type: 'message_sent',
          severity: 'info',
          data: { 
            event: 'session_ended', 
            finalMetrics: finalMetrics,
            effectiveness,
            duration: session.endTime.getTime() - session.startTime.getTime()
          },
          description: 'Study session completed'
        });

        return {
          sessionId,
          success: true,
          data: { 
            session, 
            finalMetrics, 
            effectiveness 
          },
          monitoringData: {
            sessionStatus: 'completed',
            healthUpdate: session.healthStatus,
            metrics: finalMetrics,
            alerts: [],
            recommendations: this.generateSessionEndRecommendations(finalMetrics, effectiveness)
          }
        };
      }

      return {
        sessionId,
        success: true,
        data: { session },
        monitoringData: {
          sessionStatus: 'completed',
          healthUpdate: session.healthStatus,
          metrics: {},
          alerts: [],
          recommendations: []
        }
      };

    } catch (error) {
      return {
        sessionId,
        success: false,
        error: {
          code: 'SESSION_END_FAILED',
          message: error instanceof Error ? error.message : 'Failed to end session monitoring',
          recoverable: true
        },
        monitoringData: {
          sessionStatus: 'interrupted',
          healthUpdate: {},
          metrics: {},
          alerts: [],
          recommendations: []
        }
      };
    }
  }

  /**
   * Get real-time monitoring statistics
   */
  getMonitoringStatistics(): any {
    const activeSessions = Array.from(this.activeSessions.values());
    const allMetrics = Array.from(this.sessionMetrics.values());

    return {
      activeSessions: activeSessions.length,
      totalSessions: activeSessions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(activeSessions),
      averageMessagesPerSession: allMetrics.length > 0 ? 
        allMetrics.reduce((sum, m) => sum + m.totalMessages, 0) / allMetrics.length : 0,
      averageEngagementScore: allMetrics.length > 0 ?
        allMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / allMetrics.length : 0,
      averageAccuracyScore: allMetrics.length > 0 ?
        allMetrics.reduce((sum, m) => sum + m.accuracyScore, 0) / allMetrics.length : 0,
      healthDistribution: this.getHealthDistribution(activeSessions),
      providerStatus: this.getProviderStatusSummary()
    };
  }

  /**
   * Start real-time monitoring loop
   */
  private startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performPeriodicHealthChecks();
        await this.cleanupExpiredSessions();
        await this.generatePeriodicReports();
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, this.monitoringFrequency);
  }

  /**
   * Initialize session metrics
   */
  private initializeSessionMetrics(): StudySessionMetrics {
    return {
      totalMessages: 0,
      responseTime: [],
      accuracyScore: 0,
      engagementScore: 1.0,
      learningVelocity: 0,
      errorRate: 0,
      satisfactionScore: 0,
      contextSwitches: 0,
      focusTime: 0,
      breakTime: 0,
      topicsCovered: 0,
      questionsAsked: 0,
      correctionsMade: 0
    };
  }

  /**
   * Initialize health status
   */
  private initializeHealthStatus(): SessionHealthStatus {
    return {
      overall: 'healthy',
      aiProviders: {},
      sessionQuality: 1.0,
      systemLoad: 0,
      errorCount: 0,
      warnings: [],
      criticalIssues: []
    };
  }

  /**
   * Log session event
   */
  private async logSessionEvent(sessionId: string, eventData: Omit<StudySessionEvent, 'id' | 'timestamp'>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const event: StudySessionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...eventData
    };

    session.events.push(event);
    
    // Keep only recent events to prevent memory issues
    if (session.events.length > 100) {
      session.events = session.events.slice(-50);
    }

    // Handle critical events immediately
    if (event.severity === 'critical' || event.severity === 'error') {
      await this.handleCriticalEvent(sessionId, event);
    }
  }

  /**
   * Check for alerts based on current metrics
   */
  private async checkForAlerts(sessionId: string, metrics: StudySessionMetrics): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    // Performance alerts
    if (metrics.responseTime.length > 0) {
      const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
      if (avgResponseTime > 10000) {
        alerts.push({
          id: `alert-${Date.now()}-performance`,
          type: 'performance',
          severity: avgResponseTime > 20000 ? 'critical' : 'high',
          message: `High response time detected: ${avgResponseTime.toFixed(0)}ms`,
          timestamp: new Date(),
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Check AI provider status',
            'Consider switching to faster provider',
            'Optimize request parameters'
          ]
        });
      }
    }

    // Quality alerts
    if (metrics.accuracyScore < 0.7) {
      alerts.push({
        id: `alert-${Date.now()}-quality`,
        type: 'quality',
        severity: metrics.accuracyScore < 0.5 ? 'high' : 'medium',
        message: `Low accuracy score detected: ${(metrics.accuracyScore * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: true,
        suggestedActions: [
          'Review user feedback',
          'Check context relevance',
          'Verify AI model performance'
        ]
      });
    }

    // Engagement alerts
    if (metrics.engagementScore < 0.4) {
      alerts.push({
        id: `alert-${Date.now()}-engagement`,
        type: 'engagement',
        severity: 'medium',
        message: 'Low engagement detected',
        timestamp: new Date(),
        resolved: false,
        actionRequired: true,
        suggestedActions: [
          'Consider changing interaction style',
          'Add more interactive elements',
          'Check if content is appropriate'
        ]
      });
    }

    // Error rate alerts
    if (metrics.errorRate > 0.15) {
      alerts.push({
        id: `alert-${Date.now()}-technical`,
        type: 'technical',
        severity: metrics.errorRate > 0.3 ? 'critical' : 'high',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: true,
        suggestedActions: [
          'Check system logs',
          'Verify API connectivity',
          'Review error patterns'
        ]
      });
    }

    return alerts;
  }

  /**
   * Update session health status
   */
  private async updateSessionHealth(sessionId: string, metrics: StudySessionMetrics, alerts: MonitoringAlert[]): Promise<Partial<SessionHealthStatus>> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return {};

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      overall = 'critical';
    } else if (highAlerts.length > 0 || metrics.engagementScore < 0.5) {
      overall = 'warning';
    }

    return {
      overall,
      sessionQuality: this.calculateSessionQuality(metrics),
      errorCount: Math.floor(metrics.errorRate * metrics.totalMessages),
      warnings: alerts.filter(a => a.severity === 'medium').map(a => a.message),
      criticalIssues: criticalAlerts.map(a => a.message)
    };
  }

  /**
   * Calculate session quality score
   */
  private calculateSessionQuality(metrics: StudySessionMetrics): number {
    const weights = {
      accuracy: 0.3,
      engagement: 0.25,
      performance: 0.2,
      satisfaction: 0.15,
      efficiency: 0.1
    };

    const performanceScore = metrics.responseTime.length > 0 ? 
      Math.max(0, 1 - (metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length) / 10000) : 1;

    const efficiencyScore = metrics.totalMessages > 0 ? 
      Math.min(1, metrics.learningVelocity / 10) : 0;

    return (
      metrics.accuracyScore * weights.accuracy +
      metrics.engagementScore * weights.engagement +
      performanceScore * weights.performance +
      metrics.satisfactionScore * weights.satisfaction +
      efficiencyScore * weights.efficiency
    );
  }

  /**
   * Check AI provider health
   */
  private async checkAIProviderHealth(): Promise<Record<string, { healthy: boolean; responseTime: number; lastCheck: Date }>> {
    try {
      const health = await aiServiceManager.healthCheck();
      
      return Object.entries(health).reduce((acc, [provider, status]) => {
        acc[provider] = {
          healthy: status.healthy,
          responseTime: status.responseTime || 0,
          lastCheck: new Date()
        };
        return acc;
      }, {} as Record<string, { healthy: boolean; responseTime: number; lastCheck: Date }>);
      
    } catch (error) {
      // Return default unhealthy status for all providers
      return {
        groq: { healthy: false, responseTime: 0, lastCheck: new Date() },
        gemini: { healthy: false, responseTime: 0, lastCheck: new Date() },
        cerebras: { healthy: false, responseTime: 0, lastCheck: new Date() }
      };
    }
  }

  /**
   * Get current system load
   */
  private async getCurrentSystemLoad(): Promise<number> {
    // Simplified system load calculation
    // In a real implementation, this would check actual system metrics
    return Math.random() * 100;
  }

  /**
   * Handle critical events
   */
  private async handleCriticalEvent(sessionId: string, event: StudySessionEvent): Promise<void> {
    // Log critical event
    console.error(`Critical event in session ${sessionId}:`, event);
    
    // Notify monitoring callbacks
    const alert: MonitoringAlert = {
      id: event.id,
      type: 'technical',
      severity: 'critical',
      message: event.description,
      timestamp: event.timestamp,
      resolved: false,
      actionRequired: true,
      suggestedActions: ['Immediate attention required', 'Check system logs']
    };

    // Notify registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
  }

  /**
   * Calculate study effectiveness
   */
  private calculateStudyEffectiveness(metrics: StudySessionMetrics, session: StudySession): StudyEffectivenessMetrics {
    const sessionDuration = session.endTime ? 
      session.endTime.getTime() - session.startTime.getTime() : 0;
    const sessionHours = sessionDuration / (1000 * 60 * 60);

    return {
      sessionEffectiveness: this.calculateSessionQuality(metrics),
      learningVelocity: sessionHours > 0 ? metrics.topicsCovered / sessionHours : 0,
      retentionRate: metrics.accuracyScore,
      engagementScore: metrics.engagementScore,
      satisfactionTrend: metrics.satisfactionScore > 0.7 ? 'improving' : 
                         metrics.satisfactionScore > 0.4 ? 'stable' : 'declining',
      adaptationSuccess: 1.0 - metrics.errorRate,
      recommendedActions: this.generateEffectivenessRecommendations(metrics),
      nextSessionPreparation: this.generatePreparationRecommendations(metrics)
    };
  }

  /**
   * Generate initial recommendations
   */
  private generateInitialRecommendations(context: StudySessionContext): string[] {
    const recommendations: string[] = [];

    if (context.sessionType === 'assessment') {
      recommendations.push('Focus on accuracy over speed for assessment sessions');
    } else if (context.sessionType === 'practice') {
      recommendations.push('Emphasize learning and improvement over performance');
    }

    if (context.difficulty === 'advanced') {
      recommendations.push('Monitor for signs of frustration with advanced content');
    }

    return recommendations;
  }

  /**
   * Generate metric-based recommendations
   */
  private generateMetricBasedRecommendations(metrics: StudySessionMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.engagementScore < 0.6) {
      recommendations.push('Consider increasing interaction frequency');
    }

    if (metrics.responseTime.length > 0) {
      const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
      if (avgResponseTime > 8000) {
        recommendations.push('Response times are slow - consider optimizing');
      }
    }

    if (metrics.accuracyScore < 0.7) {
      recommendations.push('Accuracy is below target - review content difficulty');
    }

    return recommendations;
  }

  /**
   * Generate session end recommendations
   */
  private generateSessionEndRecommendations(metrics: StudySessionMetrics, effectiveness: StudyEffectivenessMetrics): string[] {
    const recommendations: string[] = [];

    if (effectiveness.sessionEffectiveness > 0.8) {
      recommendations.push('Excellent session! Consider maintaining current approach');
    } else if (effectiveness.sessionEffectiveness < 0.5) {
      recommendations.push('Session effectiveness was low - consider adjusting strategy');
    }

    if (metrics.breakTime < 300000) { // Less than 5 minutes
      recommendations.push('Consider taking more frequent breaks for better retention');
    }

    if (metrics.contextSwitches > 5) {
      recommendations.push('High context switching detected - focus on single topics longer');
    }

    return recommendations;
  }

  /**
   * Generate effectiveness recommendations
   */
  private generateEffectivenessRecommendations(metrics: StudySessionMetrics): string[] {
    return this.generateMetricBasedRecommendations(metrics);
  }

  /**
   * Generate preparation recommendations
   */
  private generatePreparationRecommendations(metrics: StudySessionMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.learningVelocity > 5) {
      recommendations.push('High learning velocity - prepare more challenging content');
    } else if (metrics.learningVelocity < 1) {
      recommendations.push('Slow learning pace - ensure adequate foundational knowledge');
    }

    if (metrics.correctionsMade > metrics.totalMessages * 0.3) {
      recommendations.push('High correction rate - review content quality and clarity');
    }

    return recommendations;
  }

  /**
   * Perform periodic health checks
   */
  private async performPeriodicHealthChecks(): Promise<void> {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.status === 'active') {
        try {
          await this.performSessionHealthCheck(sessionId);
        } catch (error) {
          console.error(`Periodic health check failed for session ${sessionId}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      // Mark sessions as expired if inactive for more than 30 minutes
      const lastEvent = session.events[session.events.length - 1];
      if (lastEvent && now.getTime() - lastEvent.timestamp.getTime() > 30 * 60 * 1000) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'interrupted';
        await this.logSessionEvent(sessionId, {
          type: 'error',
          severity: 'warning',
          data: { reason: 'session_expired' },
          description: 'Session marked as expired due to inactivity'
        });
      }
    }
  }

  /**
   * Generate periodic reports
   */
  private async generatePeriodicReports(): Promise<void> {
    // This would generate periodic monitoring reports
    // For now, just log statistics periodically
    if (Math.random() < 0.1) { // 10% chance each cycle
      console.log('Real-time monitoring statistics:', this.getMonitoringStatistics());
    }
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(sessions: StudySession[]): number {
    const completedSessions = sessions.filter(s => s.endTime);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (session.endTime!.getTime() - session.startTime.getTime());
    }, 0);

    return totalDuration / completedSessions.length / (1000 * 60); // Return in minutes
  }

  /**
   * Get health distribution
   */
  private getHealthDistribution(sessions: StudySession[]): Record<string, number> {
    const distribution = { healthy: 0, warning: 0, critical: 0 };
    
    sessions.forEach(session => {
      distribution[session.healthStatus.overall] = (distribution[session.healthStatus.overall] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get provider status summary
   */
  private getProviderStatusSummary(): any {
    // This would aggregate provider status across all sessions
    return {
      totalProviders: 3,
      healthyProviders: 2,
      averageResponseTime: 1500,
      totalRequests: 100
    };
  }

  /**
   * Register alert callback
   */
  registerAlertCallback(id: string, callback: (alert: MonitoringAlert) => void): void {
    this.alertCallbacks.set(id, callback);
  }

  /**
   * Unregister alert callback
   */
  unregisterAlertCallback(id: string): void {
    this.alertCallbacks.delete(id);
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get active session
   */
  getActiveSession(sessionId: string): StudySession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllActiveSessions(): StudySession[] {
    return Array.from(this.activeSessions.values());
  }
}

// Export singleton instance
export const realTimeMonitor = new RealTimeMonitor();