// AI Orchestrator Endpoint
// ========================
// Intelligent coordinator for managing complex AI requests by delegating to specialized endpoints

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/error-logger-server-safe';
import type { AIProvider } from '@/types/api-test';

// Request/Response interfaces
interface OrchestratorRequest {
  operation: 'chat' | 'memory_search' | 'memory_store' | 'personalize' | 'web_search' | 'embed' | 'orchestrate';
  userId: string;
  conversationId?: string;
  data?: any;
  options?: {
    parallel?: boolean;
    fallback?: boolean;
    timeout?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    maxRetries?: number;
    enableMetrics?: boolean;
  };
  steps?: Array<{
    id: string;
    operation: string;
    data: any;
    dependsOn?: string[];
    timeout?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>;
  metadata?: {
    sessionId?: string;
    userAgent?: string;
    clientId?: string;
    version?: string;
  };
}

interface StepResult {
  id: string;
  operation: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  metadata?: {
    endpoint?: string;
    retryCount?: number;
    fallbackUsed?: boolean;
  };
}

interface OrchestratorResponse {
  success: boolean;
  data?: {
    results: StepResult[];
    summary: {
      totalSteps: number;
      successfulSteps: number;
      failedSteps: number;
      totalDuration: number;
      averageDuration: number;
    };
    performance: {
      totalTime: number;
      networkCalls: number;
      cacheHits: number;
      fallbackUsed: boolean;
      retryCount: number;
    };
    errors: Array<{
      stepId: string;
      operation: string;
      error: string;
      code: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata: {
    requestId: string;
    operation: string;
    processingTime: number;
    timestamp: string;
    version: string;
  };
}

// Service endpoints configuration
const AI_ENDPOINTS = {
  chat: '/api/chat/study-assistant/send',
  memory_search: '/api/ai/semantic-search',
  memory_store: '/api/ai/memory-storage',
  personalize: '/api/ai/personalized',
  web_search: '/api/ai/web-search', // Future endpoint
  embed: '/api/ai/embeddings' // Future endpoint
} as const;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Validate orchestrator request
 */
function validateOrchestratorRequest(request: OrchestratorRequest): { valid: boolean; error?: string } {
  if (!request.operation || !['chat', 'memory_search', 'memory_store', 'personalize', 'web_search', 'embed', 'orchestrate'].includes(request.operation)) {
    return { valid: false, error: 'Invalid or missing operation' };
  }

  if (!request.userId) {
    return { valid: false, error: 'Missing required field: userId' };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(request.userId)) {
    return { valid: false, error: 'userId must be a valid UUID' };
  }

  // Validate orchestrated steps
  if (request.operation === 'orchestrate') {
    if (!request.steps || request.steps.length === 0) {
      return { valid: false, error: 'Orchestrated operations require steps array' };
    }

    for (const step of request.steps) {
      if (!step.id || !step.operation) {
        return { valid: false, error: 'Each step must have id and operation' };
      }
    }
  }

  return { valid: true };
}

/**
 * Make HTTP request to AI service with timeout and retry logic
 */
async function makeServiceRequest(
  endpoint: string,
  payload: any,
  options: {
    timeout?: number;
    maxRetries?: number;
    fallback?: boolean;
  } = {}
): Promise<any> {
  const { timeout = 30000, maxRetries = 3, fallback = true } = options;
  
  let lastError: Error | null = null;
  const retryDelays = [1000, 2000, 5000]; // Progressive backoff

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Orchestrator/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        return {
          data: result,
          metadata: {
            endpoint,
            retryCount: attempt,
            fallbackUsed: false
          }
        };
      }

      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        logInfo('Service request retry', {
          componentName: 'AI Orchestrator',
          endpoint,
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message
        });
        
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt] || 5000));
      } else if (!fallback) {
        throw lastError;
      }
    }
  }

  return {
    data: null,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: `Service ${endpoint} is temporarily unavailable`,
      details: lastError?.message
    },
    metadata: {
      endpoint,
      retryCount: maxRetries,
      fallbackUsed: true
    }
  };
}

/**
 * Execute single AI service operation
 */
async function executeOperation(
  operation: string,
  userId: string,
  data: any,
  options: {
    timeout?: number;
    maxRetries?: number;
    enableMetrics?: boolean;
  } = {}
): Promise<StepResult> {
  const startTime = Date.now();
  const stepId = `step_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('Executing AI operation', {
      componentName: 'AI Orchestrator',
      stepId,
      operation,
      userId: userId.substring(0, 8) + '...'
    });

    // Route to appropriate endpoint
    const endpoint = AI_ENDPOINTS[operation as keyof typeof AI_ENDPOINTS];
    if (!endpoint) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    // Prepare payload for specific endpoint
    let payload: any = { userId, ...data };

    // Endpoint-specific payload transformation
    switch (operation) {
      case 'chat':
        // Chat expects: { message, conversationId, context }
        payload = {
          userId,
          message: data.message || data.query,
          conversationId: data.conversationId,
          context: data.context,
          provider: data.provider,
          model: data.model,
          ...data.options
        };
        break;

      case 'memory_search':
        // Memory search expects: { query, limit, minSimilarity, searchType }
        payload = {
          userId,
          query: data.query,
          limit: data.limit || 5,
          minSimilarity: data.minSimilarity || 0.7,
          searchType: data.searchType || 'hybrid',
          contextLevel: data.contextLevel
        };
        break;

      case 'memory_store':
        // Memory store expects: { message, response, metadata }
        payload = {
          userId,
          message: data.message,
          response: data.response,
          conversationId: data.conversationId,
          metadata: {
            memoryType: data.memoryType || 'ai_response',
            priority: data.priority || 'medium',
            retention: data.retention || 'long_term',
            topic: data.topic,
            subject: data.subject,
            provider: data.provider,
            model: data.model,
            confidenceScore: data.confidenceScore,
            tags: data.tags || [],
            ...data.metadata
          }
        };
        break;

      case 'personalize':
        // Personalized expects: { context, preferences, memoryContext }
        payload = {
          userId,
          context: data.context,
          preferences: data.preferences,
          memoryContext: data.memoryContext,
          options: data.options
        };
        break;
    }

    const result = await makeServiceRequest(endpoint, payload, {
      timeout: options.timeout,
      maxRetries: options.maxRetries,
      fallback: true
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (result.error) {
      logError(new Error(`Operation ${operation} failed: ${result.error.message}`), {
        componentName: 'AI Orchestrator',
        stepId,
        operation,
        endpoint,
        error: result.error.message
      });

      return {
        id: stepId,
        operation,
        success: false,
        error: result.error,
        timing: {
          startTime,
          endTime,
          duration
        },
        metadata: {
          endpoint,
          retryCount: result.metadata?.retryCount || 0,
          fallbackUsed: result.metadata?.fallbackUsed || false
        }
      };
    }

    logInfo('Operation completed successfully', {
      componentName: 'AI Orchestrator',
      stepId,
      operation,
      endpoint,
      duration
    });

    return {
      id: stepId,
      operation,
      success: true,
      data: result.data,
      timing: {
        startTime,
        endTime,
        duration
      },
      metadata: {
        endpoint,
        retryCount: result.metadata?.retryCount || 0,
        fallbackUsed: result.metadata?.fallbackUsed || false
      }
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`Operation ${operation} failed: ${errorMessage}`), {
      componentName: 'AI Orchestrator',
      stepId,
      operation,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      id: stepId,
      operation,
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      timing: {
        startTime,
        endTime,
        duration
      }
    };
  }
}

/**
 * Execute multiple operations in parallel
 */
async function executeParallelOperations(
  operations: Array<{
    operation: string;
    data: any;
    timeout?: number;
  }>,
  userId: string,
  options: {
    maxRetries?: number;
    enableMetrics?: boolean;
  } = {}
): Promise<StepResult[]> {
  const promises = operations.map(op => 
    executeOperation(op.operation, userId, op.data, {
      timeout: op.timeout,
      maxRetries: options.maxRetries,
      enableMetrics: options.enableMetrics
    })
  );

  return await Promise.all(promises);
}

/**
 * Execute orchestrated workflow with dependency management
 */
async function executeOrchestratedWorkflow(
  steps: OrchestratorRequest['steps'],
  userId: string,
  options: {
    maxRetries?: number;
    enableMetrics?: boolean;
  } = {}
): Promise<StepResult[]> {
  if (!steps || steps.length === 0) {
    throw new Error('No steps provided for orchestrated workflow');
  }

  const results: StepResult[] = [];
  const completedSteps = new Set<string>();

  // Build dependency graph
  const dependencyMap = new Map<string, string[]>();
  for (const step of steps) {
    dependencyMap.set(step.id, step.dependsOn || []);
  }

  // Process steps in dependency order
  const remainingSteps = [...steps];
  
  while (remainingSteps.length > 0) {
    // Find steps that can be executed (all dependencies completed)
    const executableSteps = remainingSteps.filter(step => 
      (step.dependsOn || []).every(dep => completedSteps.has(dep))
    );

    if (executableSteps.length === 0) {
      // Check for circular dependencies
      const blockedSteps = remainingSteps.map(s => s.id);
      throw new Error(`Circular dependency detected among steps: ${blockedSteps.join(', ')}`);
    }

    // Execute executable steps in parallel
    const parallelOperations = executableSteps.map(step => ({
      operation: step.operation,
      data: step.data,
      timeout: step.timeout
    }));

    const stepResults = await executeParallelOperations(
      parallelOperations,
      userId,
      options
    );

    // Process results
    for (let i = 0; i < executableSteps.length; i++) {
      const step = executableSteps[i];
      const result = stepResults[i];
      
      results.push(result);
      completedSteps.add(step.id);
      
      // Remove from remaining steps
      const index = remainingSteps.findIndex(s => s.id === step.id);
      if (index !== -1) {
        remainingSteps.splice(index, 1);
      }
    }
  }

  return results;
}

/**
 * POST /api/ai/orchestrator - Intelligent AI request coordination
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `orchestrator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('AI orchestrator request received', {
      componentName: 'AI Orchestrator',
      requestId
    });

    // Parse and validate request
    const body = await request.json() as OrchestratorRequest;
    const validation = validateOrchestratorRequest(body);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validation.error || 'Invalid request structure'
        },
        metadata: {
          requestId,
          operation: 'unknown',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }, { status: 400 });
    }

    logInfo('Processing orchestrator request', {
      componentName: 'AI Orchestrator',
      requestId,
      operation: body.operation,
      userId: body.userId.substring(0, 8) + '...',
      hasSteps: !!body.steps,
      parallel: body.options?.parallel || false
    });

    let results: StepResult[] = [];
    const options = {
      timeout: body.options?.timeout || 30000,
      maxRetries: body.options?.maxRetries || 3,
      enableMetrics: body.options?.enableMetrics !== false
    };

    // Route based on operation type
    switch (body.operation) {
      case 'orchestrate':
        // Multi-step workflow
        results = await executeOrchestratedWorkflow(body.steps, body.userId, options);
        break;

      default:
        // Single operation
        const operationData = body.data || {};
        const result = await executeOperation(body.operation, body.userId, operationData, options);
        results = [result];
    }

    // Calculate summary and performance metrics
    const successfulSteps = results.filter(r => r.success);
    const failedSteps = results.filter(r => !r.success);
    const totalDuration = results.reduce((sum, r) => sum + r.timing.duration, 0);
    const averageDuration = totalDuration / results.length;
    
    const networkCalls = results.filter(r => r.metadata?.endpoint).length;
    const retryCount = results.reduce((sum, r) => sum + (r.metadata?.retryCount || 0), 0);
    const fallbackUsed = results.some(r => r.metadata?.fallbackUsed);

    const summary = {
      totalSteps: results.length,
      successfulSteps: successfulSteps.length,
      failedSteps: failedSteps.length,
      totalDuration,
      averageDuration
    };

    const performance = {
      totalTime: Date.now() - startTime,
      networkCalls,
      cacheHits: 0, // TODO: Implement caching
      fallbackUsed,
      retryCount
    };

    const errors = failedSteps.map(step => ({
      stepId: step.id,
      operation: step.operation,
      error: step.error?.message || 'Unknown error',
      code: step.error?.code || 'OPERATION_FAILED'
    }));

    const processingTime = Date.now() - startTime;

    logInfo('AI orchestrator completed successfully', {
      componentName: 'AI Orchestrator',
      requestId,
      operation: body.operation,
      userId: body.userId.substring(0, 8) + '...',
      totalSteps: results.length,
      successfulSteps: successfulSteps.length,
      failedSteps: failedSteps.length,
      processingTime
    });

    // Check if overall operation was successful
    const overallSuccess = failedSteps.length === 0 || 
      (body.operation !== 'orchestrate' && results[0]?.success);

    const response: OrchestratorResponse = {
      success: overallSuccess,
      data: {
        results,
        summary,
        performance,
        errors: errors.length > 0 ? errors : undefined
      },
      metadata: {
        requestId,
        operation: body.operation,
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`AI orchestrator failed: ${errorMessage}`), {
      componentName: 'AI Orchestrator',
      requestId,
      operation: 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'ORCHESTRATOR_ERROR',
        message: 'An unexpected error occurred during AI orchestration',
        details: errorMessage
      },
      metadata: {
        requestId,
        operation: 'error',
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/orchestrator - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Test connectivity to all AI endpoints
      const endpointTests = await Promise.allSettled([
        makeServiceRequest(AI_ENDPOINTS.memory_search, {
          userId: '00000000-0000-0000-0000-000000000000',
          query: 'health check',
          limit: 1
        }),
        makeServiceRequest(AI_ENDPOINTS.memory_store, {
          userId: '00000000-0000-0000-0000-000000000000',
          message: 'health check',
          response: 'test'
        }),
        makeServiceRequest(AI_ENDPOINTS.personalize, {
          userId: '00000000-0000-0000-0000-000000000000',
          context: 'health check'
        })
      ]);

      const endpoints = {
        memory_search: endpointTests[0].status === 'fulfilled',
        memory_store: endpointTests[1].status === 'fulfilled',
        personalize: endpointTests[2].status === 'fulfilled'
      };

      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Orchestrator API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          system: {
            orchestrator: {
              status: 'healthy',
              endpoints: Object.keys(AI_ENDPOINTS).length,
              available: Object.values(endpoints).filter(Boolean).length
            },
            endpoints: {
              memory_search: { available: endpoints.memory_search, endpoint: AI_ENDPOINTS.memory_search },
              memory_store: { available: endpoints.memory_store, endpoint: AI_ENDPOINTS.memory_store },
              personalize: { available: endpoints.personalize, endpoint: AI_ENDPOINTS.personalize },
              chat: { available: false, endpoint: AI_ENDPOINTS.chat, status: 'stubbed' },
              web_search: { available: false, endpoint: AI_ENDPOINTS.web_search, status: 'planned' },
              embed: { available: false, endpoint: AI_ENDPOINTS.embed, status: 'planned' }
            },
            features: {
              parallel_execution: true,
              fallback_logic: true,
              dependency_management: true,
              performance_metrics: true,
              timeout_handling: true,
              retry_mechanisms: true
            }
          }
        }
      });
    }

    if (action === 'test-orchestrator') {
      // Test orchestrator with sample orchestrated workflow
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testSteps: OrchestratorRequest['steps'] = [
        {
          id: 'search_memories',
          operation: 'memory_search',
          data: {
            query: 'previous study sessions',
            limit: 3,
            searchType: 'hybrid'
          }
        },
        {
          id: 'get_personalized',
          operation: 'personalize',
          data: {
            context: 'Study session planning',
            preferences: {
              subjects: ['mathematics'],
              timeAvailable: 60,
              currentMood: 'confident'
            },
            memoryContext: {
              query: 'study patterns',
              limit: 2
            }
          },
          dependsOn: ['search_memories']
        },
        {
          id: 'store_interaction',
          operation: 'memory_store',
          data: {
            message: 'User requested study plan',
            response: 'Generated personalized study plan',
            metadata: {
              memoryType: 'learning_interaction',
              topic: 'study_planning',
              priority: 'high'
            }
          }
        }
      ];

      try {
        const testPayload: OrchestratorRequest = {
          operation: 'orchestrate',
          userId: testUserId,
          steps: testSteps,
          options: {
            parallel: false,
            timeout: 30000,
            enableMetrics: true
          }
        };

        const testRequest = new NextRequest('http://localhost/api/ai/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        const result = await POST(testRequest);
        const resultData = await result.json();

        return NextResponse.json({
          success: true,
          data: {
            testPerformed: true,
            testResult: resultData,
            timestamp: new Date().toISOString()
          }
        });

      } catch (testError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: 'Orchestrator test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error'
          },
          data: {
            testPerformed: true,
            testResult: 'failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Default: Return API information
    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'AI Orchestrator',
        description: 'Intelligent coordinator for managing complex AI requests by delegating to specialized endpoints',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            operation: "Operation type: 'chat' | 'memory_search' | 'memory_store' | 'personalize' | 'web_search' | 'embed' | 'orchestrate'",
            userId: 'UUID string (required)',
            conversationId: 'Optional conversation identifier',
            data: 'Operation-specific data payload',
            options: {
              parallel: 'Optional: enable parallel execution',
              fallback: 'Optional: enable fallback logic',
              timeout: 'Optional: request timeout in ms',
              maxRetries: 'Optional: maximum retry attempts',
              enableMetrics: 'Optional: enable performance metrics'
            },
            steps: 'For orchestrated operations: array of steps to execute'
          },
          response: {
            results: 'Array of step execution results',
            summary: 'Execution summary with success/failure counts',
            performance: 'Performance metrics and timing information',
            errors: 'Array of any errors encountered'
          }
        },
        supported_operations: {
          chat: 'General AI conversation with memory and personalization',
          memory_search: 'Find relevant memories using semantic search',
          memory_store: 'Store conversation data and learning interactions',
          personalize: 'Get personalized study suggestions with memory context',
          web_search: 'Search the web for information (planned)',
          embed: 'Create vector embeddings (planned)',
          orchestrate: 'Complex multi-step AI operations with dependency management'
        },
        advanced_features: {
          multi_step_workflows: 'Chain multiple AI services for complex tasks',
          parallel_execution: 'Run independent operations in parallel for speed',
          fallback_logic: 'If one service fails, try alternatives',
          request_batching: 'Handle multiple similar requests efficiently',
          response_aggregation: 'Combine results from multiple services',
          dependency_management: 'Execute steps based on dependencies',
          performance_monitoring: 'Track timing and resource usage metrics'
        },
        endpoints_coordinated: {
          memory_search: '/api/ai/semantic-search',
          memory_store: '/api/ai/memory-storage',
          personalize: '/api/ai/personalized',
          chat: '/api/chat/study-assistant/send',
          web_search: '/api/ai/web-search (planned)',
          embed: '/api/ai/embeddings (planned)'
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Orchestrator',
      operation: 'health_check'
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to perform health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}