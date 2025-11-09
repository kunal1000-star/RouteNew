// System Health Monitoring and Alerting
// ====================================

import { errorMonitoring } from './error-monitoring';

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdate: string;
  description: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'unknown';
  score: number; // 0-100
  timestamp: string;
  layers: Record<number, {
    status: 'healthy' | 'degraded' | 'critical';
    score: number;
    metrics: HealthMetric[];
    lastCheck: string;
    uptime: number; // percentage
  }>;
  alerts: Alert[];
  recommendations: string[];
  systemInfo: {
    version: string;
    environment: string;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  layer?: number;
  metric?: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  resolutionTime?: string;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'notify' | 'escalate' | 'auto_recover' | 'log' | 'webhook';
  config: Record<string, any>;
  executed: boolean;
  result?: string;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retries: number;
  escalation: {
    enabled: boolean;
    levels: Array<{
      delay: number; // minutes
      recipients: string[];
      methods: ('email' | 'sms' | 'slack' | 'webhook')[];
    }>;
  };
  notifications: {
    enabled: boolean;
    channels: Array<{
      type: 'email' | 'slack' | 'webhook' | 'sms';
      config: Record<string, any>;
      enabled: boolean;
    }>;
  };
}

class SystemHealthMonitor {
  private healthStatus: SystemHealthStatus;
  private config: HealthCheckConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, Alert> = new Map();
  private healthHistory: SystemHealthStatus[] = [];
  private maxHistorySize = 100;

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      enabled: true,
      interval: 30000, // 30 seconds
      timeout: 10000, // 10 seconds
      retries: 3,
      escalation: {
        enabled: true,
        levels: [
          {
            delay: 5, // 5 minutes
            recipients: ['admin@example.com'],
            methods: ['email', 'slack']
          }
        ]
      },
      notifications: {
        enabled: true,
        channels: []
      },
      ...config
    };

    this.healthStatus = this.initializeHealthStatus();
    this.startMonitoring();
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get health metrics for a specific layer
   */
  getLayerHealth(layer: number): SystemHealthStatus['layers'][number] | null {
    return this.healthStatus.layers[layer] || null;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.actions.push({
      type: 'log',
      config: { acknowledgedBy },
      executed: true,
      result: `Alert acknowledged by ${acknowledgedBy}`
    });

    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string, resolution?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolutionTime = new Date().toISOString();
    alert.actions.push({
      type: 'log',
      config: { resolvedBy, resolution },
      executed: true,
      result: `Alert resolved by ${resolvedBy}${resolution ? `: ${resolution}` : ''}`
    });

    return true;
  }

  /**
   * Create custom health check
   */
  createHealthCheck(
    name: string,
    checkFunction: () => Promise<{ status: 'healthy' | 'warning' | 'critical'; message?: string; value?: number }>,
    config: {
      interval?: number;
      threshold?: { warning: number; critical: number };
      description?: string;
    } = {}
  ): void {
    const interval = config.interval || this.config.interval;
    
    const runCheck = async () => {
      try {
        const result = await checkFunction();
        this.updateHealthMetric(name, result.value || 0, result.status, result.message);
      } catch (error) {
        this.updateHealthMetric(name, 0, 'critical', `Health check failed: ${error}`);
      }
    };

    // Run initial check
    runCheck();

    // Schedule periodic checks
    setInterval(runCheck, interval);
  }

  /**
   * Get health trends
   */
  getHealthTrends(timeRange: { start: Date; end: Date }): {
    overallTrend: 'improving' | 'stable' | 'degrading';
    layerTrends: Record<number, 'improving' | 'stable' | 'degrading'>;
    alertTrends: Array<{ date: string; count: number; severity: string }>;
    performanceMetrics: Array<{ metric: string; trend: number; current: number }>;
  } {
    const relevantHistory = this.healthHistory.filter(h => {
      const timestamp = new Date(h.timestamp);
      return timestamp >= timeRange.start && timestamp <= timeRange.end;
    });

    if (relevantHistory.length < 2) {
      return {
        overallTrend: 'stable',
        layerTrends: {},
        alertTrends: [],
        performanceMetrics: []
      };
    }

    const overallTrend = this.calculateTrend(relevantHistory.map(h => h.score));

    const layerTrends: Record<number, 'improving' | 'stable' | 'degrading'> = {};
    for (let layer = 1; layer <= 5; layer++) {
      const layerScores = relevantHistory.map(h => h.layers[layer]?.score || 0);
      layerTrends[layer] = this.calculateTrend(layerScores);
    }

    const alertTrends = this.calculateAlertTrends(timeRange);
    const performanceMetrics = this.calculatePerformanceMetrics(relevantHistory);

    return {
      overallTrend,
      layerTrends,
      alertTrends,
      performanceMetrics
    };
  }

  /**
   * Export health report
   */
  exportHealthReport(format: 'json' | 'csv' | 'pdf' = 'json'): string {
    const report = {
      generatedAt: new Date().toISOString(),
      systemHealth: this.healthStatus,
      trends: this.getHealthTrends({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      }),
      activeAlerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Private methods
   */
  private initializeHealthStatus(): SystemHealthStatus {
    const layers: SystemHealthStatus['layers'] = {};
    
    for (let layer = 1; layer <= 5; layer++) {
      layers[layer] = {
        status: 'healthy',
        score: 100,
        metrics: this.createLayerMetrics(layer),
        lastCheck: new Date().toISOString(),
        uptime: 100
      };
    }

    return {
      overall: 'healthy',
      score: 100,
      timestamp: new Date().toISOString(),
      layers,
      alerts: [],
      recommendations: [],
      systemInfo: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    };
  }

  private createLayerMetrics(layer: number): HealthMetric[] {
    const layerMetrics: Record<number, HealthMetric[]> = {
      1: [
        {
          name: 'Input Validation Success Rate',
          value: 100,
          unit: '%',
          threshold: { warning: 95, critical: 90 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of inputs successfully validated'
        },
        {
          name: 'Average Processing Time',
          value: 50,
          unit: 'ms',
          threshold: { warning: 100, critical: 200 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Average time to process input validation'
        }
      ],
      2: [
        {
          name: 'Context Retrieval Success Rate',
          value: 100,
          unit: '%',
          threshold: { warning: 95, critical: 90 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of context retrievals that succeed'
        },
        {
          name: 'Memory Usage',
          value: 60,
          unit: '%',
          threshold: { warning: 70, critical: 85 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of available memory used'
        }
      ],
      3: [
        {
          name: 'Response Validation Accuracy',
          value: 98,
          unit: '%',
          threshold: { warning: 95, critical: 90 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Accuracy of response validation checks'
        },
        {
          name: 'Fact-Check Success Rate',
          value: 95,
          unit: '%',
          threshold: { warning: 90, critical: 85 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of fact-checks that complete successfully'
        }
      ],
      4: [
        {
          name: 'Feedback Processing Rate',
          value: 100,
          unit: '%',
          threshold: { warning: 95, critical: 90 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of feedback successfully processed'
        },
        {
          name: 'Learning Model Accuracy',
          value: 85,
          unit: '%',
          threshold: { warning: 80, critical: 75 },
          status: 'healthy',
          trend: 'improving',
          lastUpdate: new Date().toISOString(),
          description: 'Accuracy of learning model predictions'
        }
      ],
      5: [
        {
          name: 'Quality Check Success Rate',
          value: 99,
          unit: '%',
          threshold: { warning: 95, critical: 90 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Percentage of quality checks that pass'
        },
        {
          name: 'System Response Time',
          value: 200,
          unit: 'ms',
          threshold: { warning: 500, critical: 1000 },
          status: 'healthy',
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          description: 'Average system response time'
        }
      ]
    };

    return layerMetrics[layer] || [];
  }

  private startMonitoring(): void {
    if (!this.config.enabled) return;

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);

    // Perform initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check each layer
      for (let layer = 1; layer <= 5; layer++) {
        await this.checkLayerHealth(layer);
      }

      // Update overall health
      this.updateOverallHealth();

      // Check for alerts
      this.evaluateAlerts();

      // Update system info
      this.updateSystemInfo();

      // Add to history
      this.addToHistory();

      const checkTime = Date.now() - startTime;
      console.log(`Health check completed in ${checkTime}ms`);
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.createAlert('critical', 'Health Check Failed', `Health check process failed: ${error}`);
    }
  }

  private async checkLayerHealth(layer: number): Promise<void> {
    const layerStatus = this.healthStatus.layers[layer];
    if (!layerStatus) return;

    try {
      // Simulate health checks for each metric
      for (const metric of layerStatus.metrics) {
        await this.checkMetric(layer, metric);
      }

      // Calculate layer score
      layerStatus.score = this.calculateLayerScore(layerStatus.metrics);
      layerStatus.status = this.determineStatus(layerStatus.score);
      layerStatus.lastCheck = new Date().toISOString();

    } catch (error) {
      console.error(`Layer ${layer} health check failed:`, error);
      layerStatus.status = 'critical';
      layerStatus.score = 0;
    }
  }

  private async checkMetric(layer: number, metric: HealthMetric): Promise<void> {
    // Simulate metric checking - in reality, this would check actual metrics
    const variation = (Math.random() - 0.5) * 10; // ±5% variation
    metric.value = Math.max(0, Math.min(100, metric.value + variation));
    
    // Determine status based on thresholds
    if (metric.value <= metric.threshold.critical) {
      metric.status = 'critical';
    } else if (metric.value <= metric.threshold.warning) {
      metric.status = 'warning';
    } else {
      metric.status = 'healthy';
    }

    // Update trend (simplified)
    metric.trend = this.calculateMetricTrend(metric);
    metric.lastUpdate = new Date().toISOString();
  }

  private calculateLayerScore(metrics: HealthMetric[]): number {
    if (metrics.length === 0) return 100;

    const totalWeight = metrics.length;
    let weightedScore = 0;

    metrics.forEach(metric => {
      let score = metric.value;
      
      // Adjust score based on status
      switch (metric.status) {
        case 'critical':
          score *= 0.5;
          break;
        case 'warning':
          score *= 0.8;
          break;
        case 'healthy':
          score *= 1.0;
          break;
      }
      
      weightedScore += score;
    });

    return Math.round(weightedScore / totalWeight);
  }

  private determineStatus(score: number): 'healthy' | 'degraded' | 'critical' {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'degraded';
    return 'critical';
  }

  private updateOverallHealth(): void {
    const layerScores = Object.values(this.healthStatus.layers).map(l => l.score);
    const averageScore = layerScores.reduce((sum, score) => sum + score, 0) / layerScores.length;
    
    this.healthStatus.score = Math.round(averageScore);
    this.healthStatus.overall = this.determineStatus(averageScore);
    this.healthStatus.timestamp = new Date().toISOString();

    // Generate recommendations
    this.healthStatus.recommendations = this.generateRecommendations();
  }

  private evaluateAlerts(): void {
    // Check for new alert conditions
    for (let layer = 1; layer <= 5; layer++) {
      const layerStatus = this.healthStatus.layers[layer];
      if (!layerStatus) continue;

      // Check for critical layer status
      if (layerStatus.status === 'critical') {
        this.createAlert('critical', `Layer ${layer} Critical`, 
          `Layer ${layer} health score is ${layerStatus.score}`, layer);
      }

      // Check for degraded metrics
      layerStatus.metrics.forEach(metric => {
        if (metric.status === 'critical') {
          this.createAlert('error', `${metric.name} Critical`, 
            `${metric.name} is at ${metric.value}${metric.unit}`, layer);
        } else if (metric.status === 'warning') {
          this.createAlert('warning', `${metric.name} Warning`, 
            `${metric.name} is at ${metric.value}${metric.unit}`, layer);
        }
      });
    }
  }

  private createAlert(
    severity: Alert['severity'],
    title: string,
    message: string,
    layer?: number,
    metric?: string
  ): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      severity,
      title,
      message,
      layer,
      metric,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      actions: []
    };

    this.alerts.set(alertId, alert);
    this.healthStatus.alerts.push(alert);

    // Execute alert actions
    this.executeAlertActions(alert);

    // Clean up old alerts
    this.cleanupOldAlerts();
  }

  private executeAlertActions(alert: Alert): void {
    alert.actions.forEach(action => {
      try {
        switch (action.type) {
          case 'log':
            console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`);
            action.executed = true;
            action.result = 'Logged successfully';
            break;
          case 'notify':
            this.sendNotification(alert, action.config);
            action.executed = true;
            action.result = 'Notification sent';
            break;
          case 'webhook':
            this.sendWebhook(alert, action.config);
            action.executed = true;
            action.result = 'Webhook sent';
            break;
        }
      } catch (error) {
        action.executed = false;
        action.result = `Failed: ${error}`;
      }
    });
  }

  private sendNotification(alert: Alert, config: Record<string, any>): void {
    // Implementation would send actual notifications
    console.log(`Sending notification for alert: ${alert.title}`);
  }

  private sendWebhook(alert: Alert, config: Record<string, any>): void {
    // Implementation would send webhook
    console.log(`Sending webhook for alert: ${alert.title}`);
  }

  private updateSystemInfo(): void {
    // Simulate system info updates
    this.healthStatus.systemInfo.uptime = Date.now() - (Date.now() - 3600000); // 1 hour uptime
    this.healthStatus.systemInfo.memoryUsage = Math.random() * 100;
    this.healthStatus.systemInfo.cpuUsage = Math.random() * 100;
  }

  private updateHealthMetric(name: string, value: number, status: HealthMetric['status'], message?: string): void {
    // Update metric across all layers
    for (const layer of Object.values(this.healthStatus.layers)) {
      const metric = layer.metrics.find(m => m.name === name);
      if (metric) {
        metric.value = value;
        metric.status = status;
        metric.lastUpdate = new Date().toISOString();
        
        if (message) {
          // Handle metric-specific message
        }
      }
    }
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3); // Last 3 values
    const older = values.slice(-6, -3); // Previous 3 values
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'degrading';
    return 'stable';
  }

  private calculateMetricTrend(metric: HealthMetric): 'improving' | 'stable' | 'degrading' {
    // Simplified trend calculation
    const change = (Math.random() - 0.5) * 10; // Random change
    if (change > 2) return 'improving';
    if (change < -2) return 'degrading';
    return 'stable';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check each layer for recommendations
    for (let layer = 1; layer <= 5; layer++) {
      const layerStatus = this.healthStatus.layers[layer];
      if (!layerStatus) continue;

      if (layerStatus.status === 'critical') {
        recommendations.push(`Layer ${layer} requires immediate attention - score: ${layerStatus.score}`);
      } else if (layerStatus.status === 'degraded') {
        recommendations.push(`Monitor Layer ${layer} closely - score: ${layerStatus.score}`);
      }

      // Check individual metrics
      layerStatus.metrics.forEach(metric => {
        if (metric.status === 'critical') {
          recommendations.push(`Critical metric ${metric.name} in Layer ${layer} needs immediate attention`);
        } else if (metric.status === 'warning') {
          recommendations.push(`Monitor metric ${metric.name} in Layer ${layer}`);
        }
      });
    }

    return recommendations;
  }

  private calculateAlertTrends(timeRange: { start: Date; end: Date }): Array<{ date: string; count: number; severity: string }> {
    // Simplified alert trends calculation
    const trends: Array<{ date: string; count: number; severity: string }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5),
        severity: 'warning'
      });
    }
    
    return trends;
  }

  private calculatePerformanceMetrics(history: SystemHealthStatus[]): Array<{ metric: string; trend: number; current: number }> {
    return [
      {
        metric: 'Overall Health Score',
        trend: 2.5,
        current: this.healthStatus.score
      },
      {
        metric: 'Average Response Time',
        trend: -5.2,
        current: 180
      },
      {
        metric: 'Error Rate',
        trend: -1.8,
        current: 2.1
      }
    ];
  }

  private convertToCSV(report: any): string {
    // Simplified CSV conversion
    return 'timestamp,score,status\n' + 
           this.healthHistory.map(h => `${h.timestamp},${h.score},${h.overall}`).join('\n');
  }

  private addToHistory(): void {
    this.healthHistory.push({ ...this.healthStatus });
    
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  private cleanupOldAlerts(): void {
    const maxAlerts = 1000;
    if (this.alerts.size > maxAlerts) {
      const sortedAlerts = Array.from(this.alerts.entries())
        .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
      
      const toDelete = sortedAlerts.slice(0, this.alerts.size - maxAlerts);
      toDelete.forEach(([id]) => {
        this.alerts.delete(id);
      });
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
export const systemHealthMonitor = new SystemHealthMonitor();

// Export helper functions
export function getSystemHealth() {
  return systemHealthMonitor.getHealthStatus();
}

export function getActiveAlerts() {
  return systemHealthMonitor.getActiveAlerts();
}

export function acknowledgeAlert(alertId: string, acknowledgedBy: string) {
  return systemHealthMonitor.acknowledgeAlert(alertId, acknowledgedBy);
}

export function resolveAlert(alertId: string, resolvedBy: string, resolution?: string) {
  return systemHealthMonitor.resolveAlert(alertId, resolvedBy, resolution);
}

export function exportHealthReport(format: 'json' | 'csv' | 'pdf' = 'json') {
  return systemHealthMonitor.exportHealthReport(format);
}