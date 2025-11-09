// Enhanced Error Handler for 5-Layer Hallucination Prevention System
// =================================================================

import { logError, logWarning, logInfo, ErrorContext } from '@/lib/error-logger';
import { errorRecovery } from '@/lib/error-recovery';

export interface HallucinationLayer {
  layer: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
}

export interface LayerError extends Error {
  layer: number;
  layerName: string;
  correlationId: string;
  recoverable: boolean;
  impact: 'low' | 'medium' | 'high' | 'critical';
  userFriendlyMessage: string;
  technicalDetails: string;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  timestamp: string;
  context: ErrorContext;
}

export interface ErrorCorrelation {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  conversationId: string;
  layersInvolved: number[];
  primaryError: LayerError;
  cascadeErrors: LayerError[];
  userMessage: string;
  systemState: 'degraded' | 'failed' | 'healthy' | 'unknown';
  resolutionStrategy: string;
}

export interface RecoveryAttempt {
  strategy: string;
  success: boolean;
  timestamp: string;
  error: string;
}

class EnhancedErrorHandler {
  private errorCorrelations: Map<string, ErrorCorrelation> = new Map();
  private recoveryAttempts: Map<string, RecoveryAttempt[]> = new Map();
  private maxCorrelations = 1000;

  // Layer definitions
  private readonly LAYERS: Record<number, HallucinationLayer> = {
    1: { layer: 1, name: 'Input Validation & Preprocessing', description: 'Input sanitization, query classification, and prompt engineering' },
    2: { layer: 2, name: 'Context & Memory Management', description: 'Enhanced context building, knowledge grounding, and conversation memory' },
    3: { layer: 3, name: 'Response Validation & Fact-Checking', description: 'Response verification, fact-checking, and confidence scoring' },
    4: { layer: 4, name: 'User Feedback & Learning', description: 'Feedback collection, learning engine, and personalization' },
    5: { layer: 5, name: 'Quality Assurance & Monitoring', description: 'Real-time monitoring, performance analytics, and hallucination detection' }
  };

  /**
   * Create a layer-specific error
   */
  createLayerError(
    layer: number,
    message: string,
    originalError?: Error,
    context: ErrorContext = {}
  ): LayerError {
    const layerInfo = this.LAYERS[layer];
    if (!layerInfo) {
      throw new Error(`Invalid layer: ${layer}`);
    }

    const correlationId = this.generateCorrelationId(context.userId, context.sessionId);
    
    const error = Object.assign(new Error(message), {
      layer,
      layerName: layerInfo.name,
      correlationId,
      recoverable: this.isRecoverableError(originalError, layer),
      impact: this.determineImpact(originalError, layer),
      userFriendlyMessage: this.generateUserFriendlyMessage(layer, message, originalError),
      technicalDetails: this.formatTechnicalDetails(originalError),
      recoveryAttempts: 0,
      maxRecoveryAttempts: this.getMaxRecoveryAttempts(layer),
      timestamp: new Date().toISOString(),
      context
    }) as LayerError;

    // Copy stack trace if available
    if (originalError?.stack) {
      error.stack = originalError.stack;
    }

    // Log the error
    logError(error, {
      layer,
      layerName: layerInfo.name,
      correlationId,
      impact: error.impact,
      recoverable: error.recoverable,
      ...context
    });

    return error;
  }

  /**
   * Track error correlation
   */
  trackErrorCorrelation(error: LayerError, context: ErrorContext = {}): string {
    const correlationId = error.correlationId;
    const existingCorrelation = this.errorCorrelations.get(correlationId);

    if (existingCorrelation) {
      // Add to cascade errors
      existingCorrelation.cascadeErrors.push(error);
      existingCorrelation.systemState = this.determineSystemState([...existingCorrelation.cascadeErrors, error]);
    } else {
      // Create new correlation
      const correlation: ErrorCorrelation = {
        id: correlationId,
        timestamp: error.timestamp,
        userId: context.userId,
        sessionId: context.sessionId || `session-${Date.now()}`,
        conversationId: context.conversationId || `conv-${Date.now()}`,
        layersInvolved: [error.layer],
        primaryError: error,
        cascadeErrors: [],
        userMessage: error.userFriendlyMessage,
        systemState: this.determineSystemState([error]),
        resolutionStrategy: this.selectResolutionStrategy(error)
      };

      this.errorCorrelations.set(correlationId, correlation);
      
      // Clean up old correlations
      this.cleanupOldCorrelations();
    }

    return correlationId;
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error: LayerError): Promise<boolean> {
    if (!error.recoverable || error.recoveryAttempts >= error.maxRecoveryAttempts) {
      return false;
    }

    error.recoveryAttempts++;
    const recoveryStrategy = this.getRecoveryStrategy(error);

    try {
      logInfo(`Attempting recovery for error ${error.correlationId}`, {
        correlationId: error.correlationId,
        layer: error.layer,
        attempt: error.recoveryAttempts,
        strategy: recoveryStrategy
      });

      const success = await this.executeRecoveryStrategy(recoveryStrategy, error);
      
      // Record recovery attempt
      this.recordRecoveryAttempt(error.correlationId, {
        strategy: recoveryStrategy,
        success,
        timestamp: new Date().toISOString(),
        error: success ? 'None' : `Recovery failed after ${error.recoveryAttempts} attempts`
      });

      if (success) {
        logInfo(`Recovery successful for error ${error.correlationId}`, {
          correlationId: error.correlationId,
          layer: error.layer,
          attempts: error.recoveryAttempts
        });
      }

      return success;
    } catch (recoveryError) {
      logError(recoveryError as Error, {
        correlationId: error.correlationId,
        layer: error.layer,
        recoveryStrategy,
        attempt: error.recoveryAttempts
      });

      this.recordRecoveryAttempt(error.correlationId, {
        strategy: recoveryStrategy,
        success: false,
        timestamp: new Date().toISOString(),
        error: (recoveryError as Error).message
      });

      return false;
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    totalErrors: number;
    criticalErrors: number;
    systemState: 'healthy' | 'degraded' | 'failed';
    layerStatus: Record<number, { healthy: boolean; errorCount: number; lastError?: string }>;
    recentCorrelations: ErrorCorrelation[];
  } {
    const allErrors = Array.from(this.errorCorrelations.values()).flatMap(c => [c.primaryError, ...c.cascadeErrors]);
    const criticalErrors = allErrors.filter(e => e.impact === 'critical');
    const systemState = this.determineSystemState(allErrors) as 'healthy' | 'degraded' | 'failed';

    const layerStatus: Record<number, { healthy: boolean; errorCount: number; lastError?: string }> = {};
    
    for (const layerNum of Object.keys(this.LAYERS).map(Number)) {
      const layerErrors = allErrors.filter(e => e.layer === layerNum);
      layerStatus[layerNum] = {
        healthy: layerErrors.filter(e => e.impact === 'critical').length === 0,
        errorCount: layerErrors.length,
        lastError: layerErrors.length > 0 ? layerErrors[layerErrors.length - 1].message : undefined
      };
    }

    return {
      totalErrors: allErrors.length,
      criticalErrors: criticalErrors.length,
      systemState,
      layerStatus,
      recentCorrelations: Array.from(this.errorCorrelations.values()).slice(-10)
    };
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId(userId?: string, sessionId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const userPrefix = userId ? userId.substring(0, 8) : 'anon';
    const sessionPrefix = sessionId ? sessionId.substring(0, 8) : 'sess';
    
    return `err-${userPrefix}-${sessionPrefix}-${timestamp}-${random}`;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(correlationId: string): string {
    const correlation = this.errorCorrelations.get(correlationId);
    if (correlation) {
      return correlation.userMessage;
    }
    return "An unexpected error occurred. Please try again later.";
  }

  /**
   * Get error details for debugging
   */
  getErrorDetails(correlationId: string): ErrorCorrelation | null {
    return this.errorCorrelations.get(correlationId) || null;
  }

  /**
   * Private helper methods
   */
  private isRecoverableError(error: Error | undefined, layer: number): boolean {
    if (!error) return true; // Assume recoverable if no specific error

    const nonRecoverablePatterns = [
      'Authentication failed',
      'Authorization denied',
      'Invalid API key',
      'Critical system failure'
    ];

    return !nonRecoverablePatterns.some(pattern => error.message.includes(pattern));
  }

  private determineImpact(error: Error | undefined, layer: number): 'low' | 'medium' | 'high' | 'critical' {
    if (!error) return 'low';

    const criticalPatterns = [
      'Database connection failed',
      'Critical system error',
      'Memory overflow',
      'Security breach'
    ];

    const highPatterns = [
      'API timeout',
      'Rate limit exceeded',
      'Service unavailable',
      'Network error'
    ];

    if (criticalPatterns.some(pattern => error.message.includes(pattern))) {
      return 'critical';
    } else if (highPatterns.some(pattern => error.message.includes(pattern))) {
      return 'high';
    } else if (layer === 5) { // Quality assurance layer failures are more critical
      return 'medium';
    }

    return 'low';
  }

  private generateUserFriendlyMessage(layer: number, message: string, error?: Error): string {
    const layerInfo = this.LAYERS[layer];
    
    const userMessages: Record<number, Record<string, string>> = {
      1: {
        'validation': 'Please check your input and try again.',
        'timeout': 'The request is taking longer than expected. Please try again.',
        'default': 'There was an issue processing your input. Please try again.'
      },
      2: {
        'context': 'I need to refresh my memory to help you better. Please try again in a moment.',
        'memory': 'I\'m having trouble accessing your conversation history. Please try again.',
        'default': 'I\'m having trouble accessing the information I need. Please try again.'
      },
      3: {
        'validation': 'I\'m double-checking my response to ensure accuracy. Please wait...',
        'fact': 'I want to make sure I give you the most accurate information. Please try again.',
        'default': 'I\'m validating my response to ensure quality. Please try again.'
      },
      4: {
        'feedback': 'I\'m learning from your feedback to provide better responses.',
        'learning': 'I\'m improving based on our conversation. Please try again.',
        'default': 'I\'m adapting to provide you with better help. Please try again.'
      },
      5: {
        'monitoring': 'I\'m running quality checks to ensure the best response.',
        'performance': 'I\'m optimizing performance to serve you better. Please try again.',
        'default': 'I\'m monitoring system performance. Please try again in a moment.'
      }
    };

    const layerMessages = userMessages[layer] || userMessages[1];
    
    // Try to match the error message to a specific user message
    for (const [key, userMessage] of Object.entries(layerMessages)) {
      if (message.toLowerCase().includes(key) || (error?.message && error.message.toLowerCase().includes(key))) {
        return `${layerInfo.name}: ${userMessage}`;
      }
    }

    return `${layerInfo.name}: ${layerMessages.default}`;
  }

  private formatTechnicalDetails(error?: Error): string {
    if (!error) return 'No additional technical details available.';
    
    return `Error Type: ${error.constructor.name}
Message: ${error.message}
Timestamp: ${new Date().toISOString()}
Stack Trace: ${error.stack || 'Not available'}`;
  }

  private getMaxRecoveryAttempts(layer: number): number {
    // Layer 1 (input validation) gets more attempts as it's usually transient
    // Layer 5 (quality assurance) gets fewer as failures are more systemic
    const attempts: Record<number, number> = {
      1: 3,
      2: 2,
      3: 2,
      4: 2,
      5: 1
    };
    
    return attempts[layer] || 1;
  }

  private determineSystemState(errors: LayerError[]): 'degraded' | 'failed' | 'healthy' | 'unknown' {
    const criticalErrors = errors.filter(e => e.impact === 'critical');
    const highErrors = errors.filter(e => e.impact === 'high');
    const recentErrors = errors.filter(e => {
      const errorTime = new Date(e.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return errorTime > fiveMinutesAgo;
    });

    if (criticalErrors.length > 0) {
      return 'failed';
    } else if (highErrors.length > 0) {
      return 'degraded';
    } else if (recentErrors.length === 0) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  private selectResolutionStrategy(error: LayerError): string {
    const strategies: Record<number, Record<string, string>> = {
      1: {
        'validation': 'retry_with_input_sanitization',
        'timeout': 'retry_with_longer_timeout',
        'default': 'retry_with_fallback_validation'
      },
      2: {
        'context': 'retry_with_cached_context',
        'memory': 'retry_with_minimal_context',
        'default': 'retry_with_enhanced_context'
      },
      3: {
        'validation': 'retry_with_alternative_validation',
        'fact': 'retry_without_fact_checking',
        'default': 'retry_with_relaxed_validation'
      },
      4: {
        'feedback': 'retry_with_learned_preferences',
        'learning': 'retry_with_default_settings',
        'default': 'retry_with_personalized_fallback'
      },
      5: {
        'monitoring': 'skip_quality_checks',
        'performance': 'retry_with_reduced_monitoring',
        'default': 'retry_with_minimal_monitoring'
      }
    };

    const layerStrategies = strategies[error.layer] || strategies[1];
    
    for (const [key, strategy] of Object.entries(layerStrategies)) {
      if (error.message.toLowerCase().includes(key)) {
        return strategy;
      }
    }

    return layerStrategies.default;
  }

  private getRecoveryStrategy(error: LayerError): string {
    return error.context.recoveryStrategy || this.selectResolutionStrategy(error);
  }

  private async executeRecoveryStrategy(strategy: string, error: LayerError): Promise<boolean> {
    // Implement specific recovery strategies based on the strategy type
    const strategies: Record<string, () => Promise<boolean>> = {
      'retry_with_input_sanitization': async () => this.retryWithInputSanitization(error),
      'retry_with_cached_context': async () => this.retryWithCachedContext(error),
      'retry_with_alternative_validation': async () => this.retryWithAlternativeValidation(error),
      'retry_with_learned_preferences': async () => this.retryWithLearnedPreferences(error),
      'skip_quality_checks': async () => this.skipQualityChecks(error),
      'retry_with_fallback_validation': async () => this.retryWithFallbackValidation(error),
      'default': async () => this.defaultRetry(error)
    };

    const strategyFn = strategies[strategy] || strategies.default;
    return await strategyFn();
  }

  private async retryWithInputSanitization(error: LayerError): Promise<boolean> {
    // Simulate input sanitization retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private async retryWithCachedContext(error: LayerError): Promise<boolean> {
    // Simulate cached context retry
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }

  private async retryWithAlternativeValidation(error: LayerError): Promise<boolean> {
    // Simulate alternative validation retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  private async retryWithLearnedPreferences(error: LayerError): Promise<boolean> {
    // Simulate learned preferences retry
    await new Promise(resolve => setTimeout(resolve, 1200));
    return true;
  }

  private async skipQualityChecks(error: LayerError): Promise<boolean> {
    // Simulate skipping quality checks
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  private async retryWithFallbackValidation(error: LayerError): Promise<boolean> {
    // Simulate fallback validation retry
    await new Promise(resolve => setTimeout(resolve, 1800));
    return true;
  }

  private async defaultRetry(error: LayerError): Promise<boolean> {
    // Default retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, error.recoveryAttempts), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  }

  private recordRecoveryAttempt(correlationId: string, attempt: RecoveryAttempt): void {
    const attempts = this.recoveryAttempts.get(correlationId) || [];
    attempts.push(attempt);
    this.recoveryAttempts.set(correlationId, attempts);
  }

  private cleanupOldCorrelations(): void {
    if (this.errorCorrelations.size > this.maxCorrelations) {
      const oldestEntries = Array.from(this.errorCorrelations.entries())
        .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime())
        .slice(0, this.errorCorrelations.size - this.maxCorrelations);
      
      oldestEntries.forEach(([id]) => {
        this.errorCorrelations.delete(id);
        this.recoveryAttempts.delete(id);
      });
    }
  }
}

// Export singleton instance
export const enhancedErrorHandler = new EnhancedErrorHandler();

// Export helper function for easier integration
export function handleLayerError(
  layer: number,
  error: Error,
  context: ErrorContext = {}
): LayerError {
  const layerError = enhancedErrorHandler.createLayerError(layer, error.message, error, context);
  enhancedErrorHandler.trackErrorCorrelation(layerError, context);
  return layerError;
}

// Export function for correlation ID generation
export function createCorrelationId(userId?: string, sessionId?: string): string {
  return enhancedErrorHandler.generateCorrelationId(userId, sessionId);
}