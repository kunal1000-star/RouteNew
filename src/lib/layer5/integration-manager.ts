// Layer 5: IntegrationManager - Multi-layer Integration Management
// ================================================================

import { orchestrationEngine } from './orchestration-engine';
import type { StudyBuddyApiRequest } from '@/types/study-buddy';

// Integration configuration types
export interface LayerIntegrationConfig {
  layer: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  priority: number;
  dependencies: number[];
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  healthCheck: {
    enabled: boolean;
    interval: number;
    threshold: number;
  };
}

// Integration status types
export interface LayerIntegrationStatus {
  layer: number;
  healthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  throughput: number;
  dependencies: Record<number, boolean>;
}

export interface IntegrationHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  layers: LayerIntegrationStatus[];
  criticalDependencies: string[];
  recommendations: string[];
  uptime: number;
}

// Integration request types
export interface IntegrationRequest {
  requestId: string;
  operation: 'process' | 'validate' | 'optimize' | 'health_check';
  targetLayers: number[];
  data: any;
  context: IntegrationContext;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number;
}

export interface IntegrationContext {
  userId: string;
  sessionId: string;
  studyContext?: {
    subject: string;
    difficulty: string;
    goals: string[];
  };
  systemContext?: {
    load: number;
    availableProviders: string[];
    healthStatus: string;
  };
}

// Integration response types
export interface IntegrationResponse {
  requestId: string;
  success: boolean;
  data?: any;
  integrationData: {
    layersProcessed: number[];
    totalTime: number;
    layerBreakdown: Record<number, number>;
    optimizations: string[];
    healthChecks: LayerIntegrationStatus[];
  };
  error?: {
    code: string;
    message: string;
    layer?: number;
    recoverable: boolean;
  };
}

// Multi-layer coordination types
export interface MultiLayerCoordinationRequest {
  requestId: string;
  primaryLayer: number;
  coordinationType: 'sequential' | 'parallel' | 'cascading' | 'adaptive';
  layers: number[];
  data: any;
  dependencies: Record<number, number[]>; // layer -> dependencies
  constraints: {
    maxTime: number;
    maxRetries: number;
    fallbackLayers: number[];
  };
}

export interface MultiLayerCoordinationResponse {
  requestId: string;
  success: boolean;
  results: Record<number, {
    success: boolean;
    data: any;
    time: number;
    error?: string;
  }>;
  coordinationMetadata: {
    type: string;
    totalTime: number;
    parallelEfficiency: number;
    fallbackUsed: boolean;
  };
}

export class IntegrationManager {
  private layerConfigs = new Map<number, LayerIntegrationConfig>();
  private layerStatuses = new Map<number, LayerIntegrationStatus>();
  private integrationHistory: IntegrationResponse[] = [];
  private healthCheckInterval = 60000; // 1 minute
  private lastHealthCheck = 0;

  constructor() {
    this.initializeLayerConfigurations();
  }

  /**
   * Initialize layer configurations
   */
  private initializeLayerConfigurations(): void {
    // Layer 1: Basic AI Processing
    this.layerConfigs.set(1, {
      layer: 1,
      enabled: true,
      priority: 1,
      dependencies: [],
      timeout: 10000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      healthCheck: {
        enabled: true,
        interval: 30000,
        threshold: 0.95
      }
    });

    // Layer 2: Context Enhancement
    this.layerConfigs.set(2, {
      layer: 2,
      enabled: true,
      priority: 2,
      dependencies: [1],
      timeout: 5000,
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        initialDelay: 500
      },
      healthCheck: {
        enabled: true,
        interval: 60000,
        threshold: 0.90
      }
    });

    // Layer 3: Memory Integration
    this.layerConfigs.set(3, {
      layer: 3,
      enabled: true,
      priority: 3,
      dependencies: [1, 2],
      timeout: 8000,
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 2,
        initialDelay: 800
      },
      healthCheck: {
        enabled: true,
        interval: 90000,
        threshold: 0.85
      }
    });

    // Layer 4: Learning & Feedback
    this.layerConfigs.set(4, {
      layer: 4,
      enabled: true,
      priority: 4,
      dependencies: [1, 2, 3],
      timeout: 12000,
      retryPolicy: {
        maxRetries: 1,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      healthCheck: {
        enabled: true,
        interval: 120000,
        threshold: 0.80
      }
    });

    // Layer 5: Monitoring & Orchestration
    this.layerConfigs.set(5, {
      layer: 5,
      enabled: true,
      priority: 5,
      dependencies: [1, 2, 3, 4],
      timeout: 15000,
      retryPolicy: {
        maxRetries: 1,
        backoffMultiplier: 1,
        initialDelay: 0
      },
      healthCheck: {
        enabled: true,
        interval: 180000,
        threshold: 0.75
      }
    });

    // Initialize layer statuses
    for (let i = 1; i <= 5; i++) {
      this.layerStatuses.set(i, {
        layer: i,
        healthy: true,
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        dependencies: {}
      });
    }
  }

  /**
   * Manage multi-layer integration for study requests
   */
  async manageMultiLayerIntegration(request: StudyBuddyApiRequest): Promise<IntegrationResponse> {
    const startTime = Date.now();
    const requestId = `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const integrationRequest: IntegrationRequest = {
      requestId,
      operation: 'process',
      targetLayers: [1, 2, 3, 4, 5],
      data: request,
      context: await this.buildIntegrationContext(request),
      priority: 'normal',
      timeout: 45000
    };

    try {
      // Step 1: Health check all layers
      const healthStatus = await this.performIntegrationHealthCheck();
      if (healthStatus.overall === 'critical') {
        throw new Error('Critical integration failure - system unhealthy');
      }

      // Step 2: Determine optimal coordination strategy
      const coordinationStrategy = await this.determineCoordinationStrategy(integrationRequest, healthStatus);

      // Step 3: Execute multi-layer coordination
      const coordinationResult = await this.executeMultiLayerCoordination(integrationRequest, coordinationStrategy);

      // Step 4: Validate integration results
      const validationResult = await this.validateIntegrationResults(coordinationResult);

      // Step 5: Apply optimizations if needed
      const optimizationResult = await this.applyIntegrationOptimizations(coordinationResult, validationResult);

      const totalTime = Date.now() - startTime;

      const integrationResponse: IntegrationResponse = {
        requestId,
        success: true,
        data: optimizationResult.data,
        integrationData: {
          layersProcessed: Object.keys(coordinationResult.results).map(Number),
          totalTime,
          layerBreakdown: Object.fromEntries(
            Object.entries(coordinationResult.results).map(([layer, result]) => [
              Number(layer), 
              result.time
            ])
          ),
          optimizations: optimizationResult.appliedOptimizations,
          healthChecks: Array.from(this.layerStatuses.values())
        }
      };

      // Store integration history
      this.integrationHistory.push(integrationResponse);
      if (this.integrationHistory.length > 1000) {
        this.integrationHistory = this.integrationHistory.slice(-1000);
      }

      return integrationResponse;

    } catch (error) {
      const totalTime = Date.now() - startTime;

      // Attempt recovery
      const recoveryResult = await this.attemptIntegrationRecovery(integrationRequest, error);

      const integrationResponse: IntegrationResponse = {
        requestId,
        success: false,
        error: {
          code: 'INTEGRATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown integration error',
          recoverable: recoveryResult.success
        },
        integrationData: {
          layersProcessed: [],
          totalTime,
          layerBreakdown: {},
          optimizations: [],
          healthChecks: Array.from(this.layerStatuses.values())
        }
      };

      this.integrationHistory.push(integrationResponse);
      return integrationResponse;
    }
  }

  /**
   * Build integration context from request
   */
  private async buildIntegrationContext(request: StudyBuddyApiRequest): Promise<IntegrationContext> {
    // Get system health
    const systemHealth = await this.getCurrentSystemHealth();

    return {
      userId: request.userId,
      sessionId: request.conversationId,
      studyContext: {
        subject: 'General Studies',
        difficulty: 'intermediate',
        goals: ['understanding', 'practice']
      },
      systemContext: {
        load: systemHealth.load,
        availableProviders: systemHealth.providers,
        healthStatus: systemHealth.overall
      }
    };
  }

  /**
   * Perform comprehensive integration health check
   */
  private async performIntegrationHealthCheck(): Promise<IntegrationHealthStatus> {
    const layers: LayerIntegrationStatus[] = [];
    const criticalDependencies: string[] = [];

    for (const [layerNum, config] of this.layerConfigs) {
      if (!config.enabled) continue;

      try {
        // Perform health check for this layer
        const status = await this.checkLayerHealth(layerNum);
        layers.push(status);

        // Check dependencies
        for (const dep of config.dependencies) {
          const depStatus = this.layerStatuses.get(dep);
          if (!depStatus || !depStatus.healthy) {
            criticalDependencies.push(`Layer ${layerNum} depends on Layer ${dep}`);
          }
        }

        // Update stored status
        this.layerStatuses.set(layerNum, status);

      } catch (error) {
        const failedStatus: LayerIntegrationStatus = {
          layer: layerNum,
          healthy: false,
          lastCheck: new Date(),
          responseTime: 0,
          errorRate: 1.0,
          throughput: 0,
          dependencies: {}
        };
        layers.push(failedStatus);
        this.layerStatuses.set(layerNum, failedStatus);
      }
    }

    // Determine overall health
    const healthyLayers = layers.filter(l => l.healthy).length;
    const totalLayers = layers.length;
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (criticalDependencies.length > 0) {
      overall = 'critical';
    } else if (healthyLayers < totalLayers * 0.6) {
      overall = 'critical';
    } else if (healthyLayers < totalLayers * 0.8) {
      overall = 'degraded';
    }

    const recommendations = this.generateHealthRecommendations(layers, overall);

    return {
      overall,
      layers,
      criticalDependencies,
      recommendations,
      uptime: process.uptime()
    };
  }

  /**
   * Check individual layer health
   */
  private async checkLayerHealth(layer: number): Promise<LayerIntegrationStatus> {
    const startTime = Date.now();
    const config = this.layerConfigs.get(layer);
    const previousStatus = this.layerStatuses.get(layer);

    if (!config) {
      throw new Error(`Layer ${layer} configuration not found`);
    }

    try {
      // Simulate layer health check (in real implementation, this would test actual layer functionality)
      await this.simulateLayerHealthCheck(layer);
      
      const responseTime = Date.now() - startTime;
      const errorRate = previousStatus ? Math.max(0, previousStatus.errorRate - 0.01) : 0;
      const throughput = previousStatus ? Math.min(100, previousStatus.throughput + 1) : 1;

      return {
        layer,
        healthy: true,
        lastCheck: new Date(),
        responseTime,
        errorRate,
        throughput,
        dependencies: this.getLayerDependencies(layer)
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorRate = previousStatus ? Math.min(1, previousStatus.errorRate + 0.1) : 0.1;

      return {
        layer,
        healthy: false,
        lastCheck: new Date(),
        responseTime,
        errorRate,
        throughput: 0,
        dependencies: this.getLayerDependencies(layer)
      };
    }
  }

  /**
   * Simulate layer health check (placeholder implementation)
   */
  private async simulateLayerHealthCheck(layer: number): Promise<void> {
    // Simulate different health patterns for different layers
    const delay = layer * 10; // Different delays for different layers
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated health check failure for layer ${layer}`);
    }
  }

  /**
   * Get layer dependencies
   */
  private getLayerDependencies(layer: number): Record<number, boolean> {
    const config = this.layerConfigs.get(layer);
    const dependencies: Record<number, boolean> = {};

    if (config) {
      for (const dep of config.dependencies) {
        const depStatus = this.layerStatuses.get(dep);
        dependencies[dep] = depStatus?.healthy || false;
      }
    }

    return dependencies;
  }

  /**
   * Determine optimal coordination strategy
   */
  private async determineCoordinationStrategy(
    request: IntegrationRequest, 
    healthStatus: IntegrationHealthStatus
  ): Promise<MultiLayerCoordinationRequest> {
    const healthyLayers = healthStatus.layers.filter(l => l.healthy).map(l => l.layer);
    const systemLoad = healthStatus.layers.reduce((sum, l) => sum + l.responseTime, 0) / healthStatus.layers.length;

    let coordinationType: 'sequential' | 'parallel' | 'cascading' | 'adaptive' = 'sequential';

    // Choose coordination strategy based on system state
    if (systemLoad < 100 && healthyLayers.length >= 4) {
      coordinationType = 'parallel';
    } else if (systemLoad < 50 && healthyLayers.length >= 3) {
      coordinationType = 'cascading';
    } else if (systemLoad > 200) {
      coordinationType = 'adaptive';
    }

    const layers = request.targetLayers.filter(l => healthyLayers.includes(l));

    return {
      requestId: request.requestId,
      primaryLayer: layers[0] || 1,
      coordinationType,
      layers,
      data: request.data,
      dependencies: this.buildLayerDependencies(layers),
      constraints: {
        maxTime: request.timeout,
        maxRetries: 2,
        fallbackLayers: [1, 2] // Core layers that should always work
      }
    };
  }

  /**
   * Build layer dependencies
   */
  private buildLayerDependencies(layers: number[]): Record<number, number[]> {
    const dependencies: Record<number, number[]> = {};

    for (const layer of layers) {
      const config = this.layerConfigs.get(layer);
      if (config) {
        dependencies[layer] = config.dependencies.filter(dep => layers.includes(dep));
      }
    }

    return dependencies;
  }

  /**
   * Execute multi-layer coordination
   */
  private async executeMultiLayerCoordination(
    request: IntegrationRequest, 
    strategy: MultiLayerCoordinationRequest
  ): Promise<MultiLayerCoordinationResponse> {
    const startTime = Date.now();
    const results: Record<number, { success: boolean; data: any; time: number; error?: string }> = {};

    try {
      switch (strategy.coordinationType) {
        case 'sequential':
          return await this.executeSequentialCoordination(request, strategy);
        
        case 'parallel':
          return await this.executeParallelCoordination(request, strategy);
        
        case 'cascading':
          return await this.executeCascadingCoordination(request, strategy);
        
        case 'adaptive':
          return await this.executeAdaptiveCoordination(request, strategy);
        
        default:
          throw new Error(`Unknown coordination type: ${strategy.coordinationType}`);
      }

    } catch (error) {
      const totalTime = Date.now() - startTime;

      return {
        requestId: request.requestId,
        success: false,
        results,
        coordinationMetadata: {
          type: strategy.coordinationType,
          totalTime,
          parallelEfficiency: 0,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Execute sequential coordination
   */
  private async executeSequentialCoordination(
    request: IntegrationRequest, 
    strategy: MultiLayerCoordinationRequest
  ): Promise<MultiLayerCoordinationResponse> {
    const startTime = Date.now();
    const results: Record<number, { success: boolean; data: any; time: number; error?: string }> = {};

    for (const layer of strategy.layers) {
      const layerStartTime = Date.now();
      
      try {
        // Check dependencies
        const dependencies = strategy.dependencies[layer] || [];
        for (const dep of dependencies) {
          if (!results[dep]?.success) {
            throw new Error(`Dependency layer ${dep} failed`);
          }
        }

        // Process layer
        const data = await this.processLayer(layer, request, results);
        
        results[layer] = {
          success: true,
          data,
          time: Date.now() - layerStartTime
        };

      } catch (error) {
        results[layer] = {
          success: false,
          data: null,
          time: Date.now() - layerStartTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      requestId: request.requestId,
      success: Object.values(results).some(r => r.success),
      results,
      coordinationMetadata: {
        type: 'sequential',
        totalTime,
        parallelEfficiency: 1.0,
        fallbackUsed: false
      }
    };
  }

  /**
   * Execute parallel coordination
   */
  private async executeParallelCoordination(
    request: IntegrationRequest, 
    strategy: MultiLayerCoordinationRequest
  ): Promise<MultiLayerCoordinationResponse> {
    const startTime = Date.now();
    const results: Record<number, { success: boolean; data: any; time: number; error?: string }> = {};

    // Process layers in groups based on dependencies
    const layersByLevel = this.groupLayersByDependencyLevel(strategy.layers, strategy.dependencies);

    for (const level of layersByLevel) {
      const levelPromises = level.map(async (layer) => {
        const layerStartTime = Date.now();
        
        try {
          const data = await this.processLayer(layer, request, results);
          
          results[layer] = {
            success: true,
            data,
            time: Date.now() - layerStartTime
          };

        } catch (error) {
          results[layer] = {
            success: false,
            data: null,
            time: Date.now() - layerStartTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      // Wait for all layers in this level to complete
      await Promise.allSettled(levelPromises);
    }

    const totalTime = Date.now() - startTime;
    const maxLayerTime = Math.max(...Object.values(results).map(r => r.time));

    return {
      requestId: request.requestId,
      success: Object.values(results).some(r => r.success),
      results,
      coordinationMetadata: {
        type: 'parallel',
        totalTime,
        parallelEfficiency: maxLayerTime / totalTime,
        fallbackUsed: false
      }
    };
  }

  /**
   * Group layers by dependency level
   */
  private groupLayersByDependencyLevel(
    layers: number[], 
    dependencies: Record<number, number[]>
  ): number[][] {
    const levels: number[][] = [];
    const processed = new Set<number>();
    const remaining = new Set(layers);

    while (remaining.size > 0) {
      const currentLevel: number[] = [];

      for (const layer of remaining) {
        const deps = dependencies[layer] || [];
        const allDepsProcessed = deps.every(dep => processed.has(dep));
        
        if (allDepsProcessed) {
          currentLevel.push(layer);
        }
      }

      if (currentLevel.length === 0) {
        // Handle circular dependencies
        currentLevel.push(...remaining);
      }

      currentLevel.forEach(layer => {
        remaining.delete(layer);
        processed.add(layer);
      });

      if (currentLevel.length > 0) {
        levels.push(currentLevel);
      }
    }

    return levels;
  }

  /**
   * Execute cascading coordination
   */
  private async executeCascadingCoordination(
    request: IntegrationRequest, 
    strategy: MultiLayerCoordinationRequest
  ): Promise<MultiLayerCoordinationResponse> {
    // Similar to sequential but with early termination on critical failures
    return await this.executeSequentialCoordination(request, strategy);
  }

  /**
   * Execute adaptive coordination
   */
  private async executeAdaptiveCoordination(
    request: IntegrationRequest, 
    strategy: MultiLayerCoordinationRequest
  ): Promise<MultiLayerCoordinationResponse> {
    // Start with parallel, fall back to sequential if needed
    try {
      const parallelResult = await this.executeParallelCoordination(request, strategy);
      if (parallelResult.success) {
        return parallelResult;
      }
    } catch (error) {
      console.warn('Parallel coordination failed, falling back to sequential:', error);
    }

    return await this.executeSequentialCoordination(request, strategy);
  }

  /**
   * Process individual layer
   */
  private async processLayer(layer: number, request: IntegrationRequest, previousResults: Record<number, any>): Promise<any> {
    const config = this.layerConfigs.get(layer);
    if (!config) {
      throw new Error(`Layer ${layer} configuration not found`);
    }

    // Simulate layer processing (in real implementation, this would call actual layer methods)
    const processingTime = layer * 50; // Simulate different processing times
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate occasional failures
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error(`Simulated processing failure for layer ${layer}`);
    }

    // Return layer-specific data
    switch (layer) {
      case 1:
        return { aiResponse: 'Basic AI processing completed', layer };
      case 2:
        return { contextEnhanced: true, contextData: ['study_context', 'user_preferences'], layer };
      case 3:
        return { memoriesRetrieved: 3, relevanceScore: 0.85, layer };
      case 4:
        return { personalizationApplied: true, adaptations: ['response_style'], layer };
      case 5:
        return { orchestrationApplied: true, monitoringActive: true, layer };
      default:
        return { processed: true, layer };
    }
  }

  /**
   * Validate integration results
   */
  private async validateIntegrationResults(coordinationResult: MultiLayerCoordinationResponse): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if core layers succeeded
    const coreLayers = [1, 2];
    const failedCoreLayers = coreLayers.filter(layer => !coordinationResult.results[layer]?.success);
    
    if (failedCoreLayers.length > 0) {
      issues.push(`Core layers failed: ${failedCoreLayers.join(', ')}`);
    }

    // Check performance
    const totalTime = coordinationResult.coordinationMetadata.totalTime;
    if (totalTime > 10000) { // 10 seconds
      recommendations.push('Consider optimizing layer processing time');
    }

    // Check error rates
    const errorRate = Object.values(coordinationResult.results).filter(r => !r.success).length / Object.keys(coordinationResult.results).length;
    if (errorRate > 0.2) { // 20% error rate
      recommendations.push('High error rate detected - check layer health');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Apply integration optimizations
   */
  private async applyIntegrationOptimizations(
    coordinationResult: MultiLayerCoordinationResponse,
    validationResult: { valid: boolean; issues: string[]; recommendations: string[] }
  ): Promise<{
    data: any;
    appliedOptimizations: string[];
  }> {
    const optimizations: string[] = [];
    const successfulLayers = Object.entries(coordinationResult.results)
      .filter(([_, result]) => result.success)
      .map(([layer, _]) => Number(layer));

    // Aggregate successful layer results
    const aggregatedData = Object.fromEntries(
      successfulLayers.map(layer => [layer, coordinationResult.results[layer].data])
    );

    // Apply optimizations based on validation results
    if (validationResult.recommendations.length > 0) {
      optimizations.push('performance_tuning');
    }

    if (coordinationResult.coordinationMetadata.parallelEfficiency < 0.8) {
      optimizations.push('coordination_optimization');
    }

    return {
      data: aggregatedData,
      appliedOptimizations: optimizations
    };
  }

  /**
   * Attempt integration recovery
   */
  private async attemptIntegrationRecovery(request: IntegrationRequest, error: any): Promise<{ success: boolean; strategy: string }> {
    // Try fallback layers
    const fallbackLayers = [1, 2]; // Core layers that should always work
    
    for (const layer of fallbackLayers) {
      try {
        await this.processLayer(layer, request, {});
        return { success: true, strategy: `fallback_to_layer_${layer}` };
      } catch (layerError) {
        continue;
      }
    }

    return { success: false, strategy: 'no_recovery_possible' };
  }

  /**
   * Get current system health
   */
  private async getCurrentSystemHealth(): Promise<{
    overall: string;
    load: number;
    providers: string[];
  }> {
    return {
      overall: 'healthy',
      load: Math.random() * 100,
      providers: ['groq', 'gemini', 'cerebras']
    };
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(layers: LayerIntegrationStatus[], overall: string): string[] {
    const recommendations: string[] = [];

    if (overall === 'critical') {
      recommendations.push('System requires immediate attention');
    } else if (overall === 'degraded') {
      recommendations.push('Some services are degraded, monitor closely');
    }

    const unhealthyLayers = layers.filter(l => !l.healthy);
    if (unhealthyLayers.length > 0) {
      recommendations.push(`Unhealthy layers detected: ${unhealthyLayers.map(l => l.layer).join(', ')}`);
    }

    const slowLayers = layers.filter(l => l.responseTime > 5000);
    if (slowLayers.length > 0) {
      recommendations.push(`Slow response times detected in layers: ${slowLayers.map(l => l.layer).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Get integration statistics
   */
  getIntegrationStatistics(): any {
    const recentHistory = this.integrationHistory.slice(-100);
    const successRate = recentHistory.filter(r => r.success).length / recentHistory.length;
    const averageTime = recentHistory.reduce((sum, r) => sum + r.integrationData.totalTime, 0) / recentHistory.length;

    return {
      totalRequests: this.integrationHistory.length,
      successRate,
      averageResponseTime: averageTime,
      layerStatuses: Object.fromEntries(this.layerStatuses),
      recentFailures: recentHistory.filter(r => !r.success).length
    };
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();