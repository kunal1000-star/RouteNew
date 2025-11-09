// Error Logging and Monitoring with Correlation IDs
// ===============================================

import { LayerError, ErrorCorrelation, enhancedErrorHandler } from './enhanced-error-handler';
import { logError, logWarning, logInfo, ErrorContext } from '@/lib/error-logger';

export interface MonitoringEvent {
  id: string;
  timestamp: string;
  type: 'error' | 'warning' | 'info' | 'recovery' | 'timeout' | 'cascading';
  correlationId: string;
  layer: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  sessionId: string;
  conversationId: string;
  duration?: number;
  retryCount?: number;
  resolved: boolean;
  resolutionTime?: string;
  source: 'client' | 'server' | 'ai-service' | 'database' | 'network' | 'system';
  metadata: Record<string, any>;
}

export interface MonitoringMetrics {
  totalEvents: number;
  errorsByType: Record<string, number>;
  errorsByLayer: Record<number, number>;
  errorsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  recoverySuccessRate: number;
  cascadingErrorRate: number;
  topErrorPatterns: Array<{
    pattern: string;
    count: number;
    impact: string;
  }>;
  systemHealthScore: number; // 0-100
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'degrading';
    changeRate: number;
    predictedIssues: string[];
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    type: 'error_rate' | 'response_time' | 'severity' | 'cascading' | 'recovery_failure';
    threshold: number;
    timeWindow: number; // in minutes
    layer?: number;
    severity?: string;
  };
  actions: {
    log: boolean;
    notify: boolean;
    alert: boolean;
    autoRecovery: boolean;
  };
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

class ErrorMonitoringSystem {
  private events: MonitoringEvent[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private correlationIndex: Map<string, string[]> = new Map(); // correlationId -> eventIds
  private maxEvents = 10000;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAlertRules();
    this.startMonitoring();
  }

  /**
   * Log a new monitoring event
   */
  logEvent(
    event: Omit<MonitoringEvent, 'id' | 'timestamp' | 'resolved'>
  ): string {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();
    
    const fullEvent: MonitoringEvent = {
      ...event,
      id: eventId,
      timestamp,
      resolved: false
    };

    // Add to events array
    this.events.push(fullEvent);
    
    // Update correlation index
    this.updateCorrelationIndex(fullEvent);
    
    // Log to traditional logging system
    this.logToTraditionalSystem(fullEvent);
    
    // Check alert rules
    this.evaluateAlertRules(fullEvent);
    
    // Clean up old events
    this.cleanupOldEvents();
    
    return eventId;
  }

  /**
   * Log an error with enhanced context
   */
  logError(
    error: LayerError,
    additionalContext: Record<string, any> = {}
  ): string {
    return this.logEvent({
      type: 'error',
      correlationId: error.correlationId,
      layer: error.layer,
      severity: error.impact,
      message: error.message,
      userId: error.context.userId,
      sessionId: error.context.sessionId || 'unknown',
      conversationId: error.context.conversationId || 'unknown',
      duration: Date.now() - new Date(error.timestamp).getTime(),
      retryCount: error.recoveryAttempts,
      source: this.determineErrorSource(error),
      metadata: {
        ...error.context,
        ...additionalContext,
        technicalDetails: error.technicalDetails,
        userFriendlyMessage: error.userFriendlyMessage,
        recoverable: error.recoverable,
        maxRecoveryAttempts: error.maxRecoveryAttempts
      }
    });
  }

  /**
   * Log a recovery attempt
   */
  logRecovery(
    correlationId: string,
    success: boolean,
    strategy: string,
    duration: number,
    additionalContext: Record<string, any> = {}
  ): string {
    return this.logEvent({
      type: success ? 'recovery' : 'error',
      correlationId,
      layer: 0, // Recovery is system-wide
      severity: success ? 'low' : 'high',
      message: `Recovery ${success ? 'successful' : 'failed'} using strategy: ${strategy}`,
      sessionId: additionalContext.sessionId || 'unknown',
      conversationId: additionalContext.conversationId || 'unknown',
      duration,
      retryCount: additionalContext.retryCount || 0,
      source: 'server',
      metadata: {
        strategy,
        ...additionalContext
      }
    });
  }

  /**
   * Get monitoring metrics
   */
  getMetrics(timeRange?: { start: Date; end: Date }): MonitoringMetrics {
    const events = timeRange 
      ? this.events.filter(e => {
          const eventTime = new Date(e.timestamp);
          return eventTime >= timeRange.start && eventTime <= timeRange.end;
        })
      : this.events;

    const totalEvents = events.length;
    const errors = events.filter(e => e.type === 'error');
    const recoveries = events.filter(e => e.type === 'recovery');
    
    // Calculate metrics
    const errorsByType = this.groupBy(events, 'type');
    const errorsByLayer = this.groupByNumeric(errors, 'layer');
    const errorsBySeverity = this.groupBy(errors, 'severity');
    
    const resolvedEvents = events.filter(e => e.resolved);
    const averageResolutionTime = resolvedEvents.length > 0
      ? resolvedEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / resolvedEvents.length
      : 0;
    
    const successfulRecoveries = recoveries.filter(r => r.severity === 'low');
    const recoverySuccessRate = recoveries.length > 0
      ? (successfulRecoveries.length / recoveries.length) * 100
      : 0;
    
    const cascadingErrors = this.identifyCascadingErrors();
    const cascadingErrorRate = errors.length > 0
      ? (cascadingErrors.length / errors.length) * 100
      : 0;
    
    const topErrorPatterns = this.identifyTopPatterns(events);
    const systemHealthScore = this.calculateHealthScore(events);
    const trendAnalysis = this.analyzeTrends(events);

    return {
      totalEvents,
      errorsByType,
      errorsByLayer,
      errorsBySeverity,
      averageResolutionTime,
      recoverySuccessRate,
      cascadingErrorRate,
      topErrorPatterns,
      systemHealthScore,
      trendAnalysis
    };
  }

  /**
   * Get events by correlation ID
   */
  getEventsByCorrelation(correlationId: string): MonitoringEvent[] {
    return this.events.filter(e => e.correlationId === correlationId);
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical';
    layers: Record<number, { status: 'healthy' | 'degraded' | 'critical'; errorRate: number; lastError?: string }>;
    alerts: Array<{ rule: AlertRule; status: 'triggered' | 'warning' | 'normal' }>;
    recommendations: string[];
  } {
    const recentEvents = this.events.filter(e => {
      const eventTime = new Date(e.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return eventTime > oneHourAgo;
    });

    const layerHealth: Record<number, { status: 'healthy' | 'degraded' | 'critical'; errorRate: number; lastError?: string }> = {};
    
    for (let layer = 1; layer <= 5; layer++) {
      const layerEvents = recentEvents.filter(e => e.layer === layer);
      const errorEvents = layerEvents.filter(e => e.type === 'error');
      const errorRate = layerEvents.length > 0 ? (errorEvents.length / layerEvents.length) * 100 : 0;
      
      let status: 'healthy' | 'degraded' | 'critical';
      if (errorRate > 20) status = 'critical';
      else if (errorRate > 10) status = 'degraded';
      else status = 'healthy';
      
      const lastError = errorEvents.length > 0 
        ? errorEvents[errorEvents.length - 1].message 
        : undefined;
      
      layerHealth[layer] = { status, errorRate, lastError };
    }

    // Determine overall health
    const criticalLayers = Object.values(layerHealth).filter(l => l.status === 'critical').length;
    const degradedLayers = Object.values(layerHealth).filter(l => l.status === 'degraded').length;
    
    let overall: 'healthy' | 'degraded' | 'critical';
    if (criticalLayers > 0) overall = 'critical';
    else if (degradedLayers > 0) overall = 'degraded';
    else overall = 'healthy';

    // Check active alerts
    const alerts = Array.from(this.alertRules.values())
      .filter(rule => rule.enabled)
      .map(rule => ({
        rule,
        status: this.evaluateAlertStatus(rule, recentEvents) as 'triggered' | 'warning' | 'normal'
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(layerHealth, recentEvents);

    return {
      overall,
      layers: layerHealth,
      alerts,
      recommendations
    };
  }

  /**
   * Create custom alert rule
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'triggerCount'>): string {
    const id = this.generateAlertId();
    const fullRule: AlertRule = {
      ...rule,
      id,
      triggerCount: 0
    };
    
    this.alertRules.set(id, fullRule);
    return id;
  }

  /**
   * Private helper methods
   */
  private initializeAlertRules(): void {
    const defaultRules: Array<Omit<AlertRule, 'id' | 'triggerCount'>> = [
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 15% in the last 10 minutes',
        condition: {
          type: 'error_rate',
          threshold: 15,
          timeWindow: 10
        },
        actions: {
          log: true,
          notify: true,
          alert: true,
          autoRecovery: false
        },
        enabled: true
      },
      {
        name: 'Critical Layer Failure',
        description: 'Alert when Layer 1 (Input Validation) has critical errors',
        condition: {
          type: 'severity',
          threshold: 1,
          timeWindow: 5,
          layer: 1,
          severity: 'critical'
        },
        actions: {
          log: true,
          notify: true,
          alert: true,
          autoRecovery: true
        },
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.createAlertRule(rule);
    });
  }

  private startMonitoring(): void {
    // Run periodic health checks every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performPeriodicHealthCheck();
    }, 30000);
  }

  private performPeriodicHealthCheck(): void {
    const health = this.getSystemHealth();
    
    if (health.overall === 'critical') {
      this.logEvent({
        type: 'error',
        correlationId: `health-check-${Date.now()}`,
        layer: 0,
        severity: 'critical',
        message: 'System health degraded to critical status',
        sessionId: 'system',
        conversationId: 'health-check',
        source: 'system',
        metadata: { health }
      });
    }
  }

  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateCorrelationIndex(event: MonitoringEvent): void {
    const eventIds = this.correlationIndex.get(event.correlationId) || [];
    eventIds.push(event.id);
    this.correlationIndex.set(event.correlationId, eventIds);
  }

  private logToTraditionalSystem(event: MonitoringEvent): void {
    const context: ErrorContext = {
      componentName: 'error-monitoring',
      correlationId: event.correlationId,
      layer: event.layer,
      sessionId: event.sessionId,
      conversationId: event.conversationId,
      userId: event.userId,
      ...event.metadata
    };

    switch (event.type) {
      case 'error':
        logError(new Error(event.message), context);
        break;
      case 'warning':
        logWarning(event.message, context);
        break;
      case 'info':
        logInfo(event.message, context);
        break;
      case 'recovery':
        logInfo(`Recovery ${event.severity === 'low' ? 'successful' : 'failed'}: ${event.message}`, context);
        break;
    }
  }

  private evaluateAlertRules(event: MonitoringEvent): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      if (this.checkAlertCondition(rule, event)) {
        rule.triggerCount++;
        rule.lastTriggered = event.timestamp;
        this.triggerAlert(rule, event);
      }
    }
  }

  private checkAlertCondition(rule: AlertRule, event: MonitoringEvent): boolean {
    const recentEvents = this.events.filter(e => {
      const eventTime = new Date(e.timestamp);
      const thresholdTime = new Date(Date.now() - rule.condition.timeWindow * 60 * 1000);
      return eventTime > thresholdTime;
    });

    switch (rule.condition.type) {
      case 'error_rate':
        const errorCount = recentEvents.filter(e => e.type === 'error').length;
        const totalCount = recentEvents.length;
        const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
        return errorRate >= rule.condition.threshold;

      case 'severity':
        return recentEvents.some(e => 
          e.severity === rule.condition.severity &&
          (!rule.condition.layer || e.layer === rule.condition.layer)
        );

      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, event: MonitoringEvent): void {
    const alertMessage = `Alert: ${rule.name} - ${rule.description}`;
    
    if (rule.actions.log) {
      logWarning(alertMessage, {
        componentName: 'alert-system',
        ruleId: rule.id,
        correlationId: event.correlationId
      });
    }

    if (rule.actions.notify) {
      // In a real implementation, this would send notifications
      console.warn(`🚨 ALERT: ${alertMessage}`, {
        rule: rule.name,
        event: event.message,
        correlationId: event.correlationId
      });
    }
  }

  private identifyCascadingErrors(): MonitoringEvent[] {
    const cascadingEvents: MonitoringEvent[] = [];
    
    for (const [correlationId, eventIds] of this.correlationIndex) {
      const events = eventIds.map(id => this.events.find(e => e.id === id)).filter(Boolean) as MonitoringEvent[];
      const errors = events.filter(e => e.type === 'error');
      
      if (errors.length >= 2) {
        const layers = [...new Set(errors.map(e => e.layer))];
        if (layers.length >= 2) {
          cascadingEvents.push(...errors);
        }
      }
    }
    
    return cascadingEvents;
  }

  private identifyTopPatterns(events: MonitoringEvent[]): Array<{ pattern: string; count: number; impact: string }> {
    const patterns = new Map<string, { count: number; severity: string[] }>();
    
    events.forEach(event => {
      const pattern = this.extractPattern(event);
      const existing = patterns.get(pattern) || { count: 0, severity: [] };
      existing.count++;
      existing.severity.push(event.severity);
      patterns.set(pattern, existing);
    });
    
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        impact: this.determineImpactFromSeverities(data.severity)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractPattern(event: MonitoringEvent): string {
    return `${event.type}_layer_${event.layer}_${event.severity}`;
  }

  private determineImpactFromSeverities(severities: string[]): string {
    if (severities.includes('critical')) return 'High';
    if (severities.includes('high')) return 'Medium';
    return 'Low';
  }

  private calculateHealthScore(events: MonitoringEvent[]): number {
    if (events.length === 0) return 100;
    
    const recentEvents = events.filter(e => {
      const eventTime = new Date(e.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return eventTime > oneHourAgo;
    });
    
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const criticalErrors = errorEvents.filter(e => e.severity === 'critical');
    
    let score = 100;
    score -= criticalErrors.length * 20;
    score -= errorEvents.length * 5;
    score -= recentEvents.length * 0.1;
    
    return Math.max(0, Math.min(100, score));
  }

  private analyzeTrends(events: MonitoringEvent[]) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = events.filter(e => {
      const eventTime = new Date(e.timestamp);
      return eventTime > oneHourAgo && e.type === 'error';
    });
    
    const recentRate = recentErrors.length;
    let direction: 'improving' | 'stable' | 'degrading';
    const changeRate = 0; // Simplified
    
    if (recentRate > 10) direction = 'degrading';
    else if (recentRate < 2) direction = 'improving';
    else direction = 'stable';
    
    const predictedIssues: string[] = [];
    
    return { direction, changeRate, predictedIssues };
  }

  private determineErrorSource(error: LayerError): 'client' | 'server' | 'ai-service' | 'database' | 'network' | 'system' {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'network';
    } else if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return 'database';
    } else if (message.includes('api') || message.includes('service') || message.includes('provider')) {
      return 'ai-service';
    } else if (message.includes('auth') || message.includes('permission') || message.includes('validation')) {
      return 'client';
    } else {
      return 'server';
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private groupByNumeric(array: any[], key: string): Record<number, number> {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<number, number>);
  }

  private evaluateAlertStatus(rule: AlertRule, events: MonitoringEvent[]): 'triggered' | 'warning' | 'normal' {
    const recentEvents = events.filter(e => {
      const eventTime = new Date(e.timestamp);
      const thresholdTime = new Date(Date.now() - rule.condition.timeWindow * 60 * 1000);
      return eventTime > thresholdTime;
    });
    
    if (this.checkAlertCondition(rule, recentEvents[0] as any)) {
      return 'triggered';
    } else if (recentEvents.length > 0) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  private generateRecommendations(
    layerHealth: Record<number, { status: string; errorRate: number }>,
    events: MonitoringEvent[]
  ): string[] {
    const recommendations: string[] = [];
    
    Object.entries(layerHealth).forEach(([layer, health]) => {
      if (health.status === 'critical') {
        recommendations.push(`Layer ${layer} requires immediate attention - error rate: ${health.errorRate}%`);
      }
    });
    
    return recommendations;
  }

  private cleanupOldEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringSystem();

// Export helper functions
export function logErrorEvent(
  error: LayerError,
  additionalContext?: Record<string, any>
): string {
  return errorMonitoring.logError(error, additionalContext);
}

export function logRecoveryEvent(
  correlationId: string,
  success: boolean,
  strategy: string,
  duration: number,
  additionalContext?: Record<string, any>
): string {
  return errorMonitoring.logRecovery(correlationId, success, strategy, duration, additionalContext || {});
}

export function getErrorMetrics(timeRange?: { start: Date; end: Date }) {
  return errorMonitoring.getMetrics(timeRange);
}

export function getSystemHealth() {
  return errorMonitoring.getSystemHealth();
}