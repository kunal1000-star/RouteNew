// Retry Mechanisms and Fallback Strategies
// =======================================

interface LayerError extends Error {
  layer: number;
  layerName: string;
  correlationId: string;
  recoverable: boolean;
  impact: 'low' | 'medium' | 'high' | 'critical';
  userFriendlyMessage: string;
  technicalDetails: string;
  recoveryAttempts: number;
  context: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  fallbackStrategies?: FallbackStrategy[];
}

export interface FallbackStrategy {
  name: string;
  description: string;
  priority: number;
  execute: (error: LayerError, context: RetryContext) => Promise<FallbackResult>;
  canHandle: (error: LayerError) => boolean;
}

export interface RetryContext {
  operation: string;
  layer: number;
  userId?: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  metadata?: Record<string, any>;
  timeoutMs?: number;
}

export interface RetryResult {
  success: boolean;
  attempts: number;
  totalTime: number;
  finalError?: LayerError;
  recovered: boolean;
  fallbackUsed?: string;
  correlationId: string;
}

export interface FallbackResult {
  success: boolean;
  result?: any;
  message: string;
  fallbackUsed: string;
  recoveryTime: number;
}

class RetryMechanism {
  /**
   * Execute an operation with retry logic and fallbacks
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: RetryContext
  ): Promise<RetryResult> {
    const startTime = Date.now();
    let lastError: LayerError;
    let attempts = 0;
    let recovered = false;
    let fallbackUsed: string | undefined;

    while (attempts <= config.maxRetries) {
      try {
        attempts++;
        const result = await operation();
        
        if (attempts > 1) {
          recovered = true;
        }
        
        return {
          success: true,
          attempts,
          totalTime: Date.now() - startTime,
          recovered,
          correlationId: context.correlationId
        };
      } catch (error) {
        lastError = this.convertToLayerError(error, context, attempts);

        if (attempts >= config.maxRetries || 
            (config.retryCondition && !config.retryCondition(error))) {
          break;
        }

        // Try fallback strategies if available
        if (config.fallbackStrategies && attempts === config.maxRetries) {
          const fallbackResult = await this.tryFallbackStrategies(lastError, config.fallbackStrategies, context);
          
          if (fallbackResult.success) {
            return {
              success: true,
              attempts,
              totalTime: Date.now() - startTime,
              recovered: true,
              fallbackUsed: fallbackResult.fallbackUsed,
              correlationId: context.correlationId
            };
          }
        }

        // Wait before retry (with exponential backoff and jitter)
        const delay = this.calculateDelay(attempts - 1, config);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      attempts,
      totalTime: Date.now() - startTime,
      finalError: lastError,
      recovered: false,
      correlationId: context.correlationId
    };
  }

  /**
   * Try fallback strategies
   */
  private async tryFallbackStrategies(
    error: LayerError,
    strategies: FallbackStrategy[],
    context: RetryContext
  ): Promise<FallbackResult> {
    const sortedStrategies = [...strategies].sort((a, b) => b.priority - a.priority);

    for (const strategy of sortedStrategies) {
      try {
        if (strategy.canHandle(error)) {
          const startTime = Date.now();
          const result = await strategy.execute(error, context);
          const recoveryTime = Date.now() - startTime;

          if (result.success) {
            return {
              ...result,
              recoveryTime
            };
          }
        }
      } catch (fallbackError) {
        // Log fallback failure
        console.warn(`Fallback strategy ${strategy.name} failed:`, fallbackError);
      }
    }

    return {
      success: false,
      message: 'All fallback strategies failed',
      fallbackUsed: 'none',
      recoveryTime: 0
    };
  }

  /**
   * Convert error to LayerError
   */
  private convertToLayerError(error: any, context: RetryContext, attempt: number): LayerError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      name: 'LayerError',
      message: errorMessage,
      layer: context.layer,
      layerName: `Layer ${context.layer}`,
      correlationId: context.correlationId,
      recoverable: true,
      impact: 'medium' as const,
      userFriendlyMessage: `An error occurred in ${context.operation}`,
      technicalDetails: errorMessage,
      recoveryAttempts: attempt,
      context: {
        componentName: context.operation,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
        userId: context.userId,
        attempt,
        operation: context.operation,
        ...context.metadata
      }
    } as LayerError;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );

    if (config.jitter) {
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(0, delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default retry configurations
export const DEFAULT_RETRY_CONFIGS = {
  aiQuery: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      return error.message?.includes('timeout') || 
             error.message?.includes('rate_limit') ||
             error.message?.includes('temporary');
    }
  } as RetryConfig,

  databaseOperation: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryCondition: (error: any) => {
      return error.message?.includes('connection') ||
             error.message?.includes('timeout') ||
             error.message?.includes('temporary');
    }
  } as RetryConfig,

  apiRequest: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      return error.status >= 500 ||
             error.message?.includes('timeout') ||
             error.message?.includes('network');
    }
  } as RetryConfig
};

// Export singleton instance
export const retryMechanism = new RetryMechanism();

// Export helper functions
export function createRetryContext(
  operation: string,
  layer: number,
  sessionId: string,
  conversationId: string,
  userId?: string,
  metadata?: Record<string, any>
): RetryContext {
  const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    operation,
    layer,
    userId,
    sessionId,
    conversationId,
    correlationId,
    metadata
  };
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  context: RetryContext
): Promise<RetryResult> {
  return retryMechanism.executeWithRetry(operation, config, context);
}