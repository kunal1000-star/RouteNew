// AI Service Manager - Unified Stable Version
// ==========================================

import type { 
  AIServiceManagerRequest,
  AIServiceManagerResponse,
  QueryType,
  ProviderTier,
  AppDataContext
} from '@/types/ai-service-manager';
import type { AIProvider } from '@/types/api-test';

// Import working provider clients
import { createGroqClient } from './providers/groq-client';
import { createGeminiClient } from './providers/gemini-client';
import { createCerebrasClient } from './providers/cerebras-client';
import { createCohereClient } from './providers/cohere-client';
import { createMistralClient } from './providers/mistral-client';
import { createOpenRouterClient } from './providers/openrouter-client';

// Import supporting services (optional)
import { responseCache } from './response-cache';
import { apiUsageLogger } from './api-logger';
import { rateLimitTracker } from './rate-limit-tracker';

// Dynamic Provider Configuration
interface ProviderConfig {
  client: any;
  healthy: boolean;
  lastCheck: number;
  responseTime: number;
  tier: number;
}

// Working providers only (to avoid missing implementations)
const ALL_PROVIDERS: Record<AIProvider, ProviderConfig> = {
  groq: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 1 },
  gemini: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 2 },
  cerebras: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 3 },
  cohere: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 4 },
  mistral: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 5 },
  openrouter: { client: null, healthy: true, lastCheck: 0, responseTime: 0, tier: 6 },
  google: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 7 }
};

// Fallback Chain Configuration (working providers only)
let DYNAMIC_FALLBACK_CHAINS: Record<QueryType, AIProvider[]> = {
  time_sensitive: ['gemini', 'groq', 'cerebras', 'mistral', 'openrouter', 'cohere'],
  app_data: ['groq', 'cerebras', 'mistral', 'gemini', 'openrouter', 'cohere'],
  general: ['groq', 'openrouter', 'cerebras', 'mistral', 'gemini', 'cohere']
};

export class AIServiceManager {
  private async createClientForProvider(providerName: AIProvider, userId: string | null) {
    const config = (ALL_PROVIDERS as any)[providerName];
    if (config?.client) return config.client;

    try {
      switch (providerName) {
        case 'groq':
          config.client = createGroqClient(process.env.GROQ_API_KEY);
          break;
        case 'gemini':
          config.client = createGeminiClient(process.env.GEMINI_API_KEY);
          break;
        case 'cerebras':
          config.client = createCerebrasClient(process.env.CEREBRAS_API_KEY);
          break;
        case 'cohere':
          config.client = createCohereClient(process.env.COHERE_API_KEY);
          break;
        case 'mistral':
          config.client = createMistralClient(process.env.MISTRAL_API_KEY);
          break;
        case 'openrouter':
          config.client = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
      return config.client;
    } catch (err) {
      // Mark provider as unhealthy when instantiation fails (likely missing API key)
      if (config) {
        config.healthy = false;
        config.lastCheck = Date.now();
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
  private healthCheckInterval: number = 300000; // 5 minutes
  private lastHealthCheck: number = 0;
  private isCheckingHealth: boolean = false;

  /**
   * Main entry point - Process query through intelligent routing
   */
  async processQuery(request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${requestId}] Processing query for user ${request.userId}, conversation ${request.conversationId}`);
      
      // Step 1: Check cache first
      if (responseCache && typeof responseCache.get === 'function') {
        const cachedResponse = responseCache.get(request);
        if (cachedResponse) {
          console.log(`[${requestId}] Cache hit for user ${request.userId}`);
          return cachedResponse.response;
        }
      }

      // Step 2: Update provider health if needed
      await this.updateProviderHealthIfNeeded();

      // Step 3: Detect query type (simplified for now)
      const queryDetection = {
        type: this.detectQueryType(request.message) as QueryType,
        confidence: 0.8
      };
      console.log(`[${requestId}] Query detected as: ${queryDetection.type}`);

      // Step 4: Get available providers for this query type
      let availableProviders = this.getAvailableProviders(queryDetection.type);
      // If a preferred provider is specified, try it first
      const preferred = (request as any).preferredProvider as AIProvider | undefined;
      if (preferred && !availableProviders.includes(preferred)) {
        availableProviders = [preferred, ...availableProviders];
      } else if (preferred) {
        // Move to front
        availableProviders = [preferred, ...availableProviders.filter(p => p !== preferred)];
      }
      console.log(`[${requestId}] Available providers: ${availableProviders.join(', ')}${preferred ? ` (preferred: ${preferred})` : ''}`);

      // Step 5: Get app data context if needed
      let appDataContext: AppDataContext | undefined;
      if (request.includeAppData) {
        appDataContext = await this.getAppDataContext(request.userId);
      }

      // Step 6: Try providers in order
      let lastError: Error | null = null;
      let fallbackUsed = false;
      let providerUsed = 'none';

      for (const providerName of availableProviders) {
        try {
          console.log(`[${requestId}] Trying provider: ${providerName}`);
          
          // Check if provider is healthy
          const providerConfig = ALL_PROVIDERS[providerName];
          if (!providerConfig.healthy) {
            console.log(`[${requestId}] Skipping unhealthy provider: ${providerName}`);
            continue;
          }

          // Check rate limits (if tracker available)
          if (rateLimitTracker && typeof rateLimitTracker.checkRateLimit === 'function') {
            const rateLimitStatus = rateLimitTracker.checkRateLimit(providerName);
            if (rateLimitStatus.status === 'blocked') {
              console.log(`[${requestId}] Skipping ${providerName} - rate limit blocked`);
              continue;
            }
          }

          // Make request to provider
          const response = await this.callProvider({
            providerName,
            request,
            queryDetection,
            appDataContext,
            tier: providerConfig.tier,
            requestId
          });

          // Record successful request (if logger available)
          if (apiUsageLogger && typeof apiUsageLogger.logSuccess === 'function') {
            try {
              await apiUsageLogger.logSuccess({
                userId: request.userId,
                featureName: 'ai_chat',
                provider: providerName,
                modelUsed: response.model_used,
                tokensInput: response.tokens_used.input,
                tokensOutput: response.tokens_used.output,
                latencyMs: response.latency_ms,
                cached: response.cached,
                queryType: queryDetection.type,
                tierUsed: providerConfig.tier,
                fallbackUsed
              });
            } catch (logError) {
              console.warn('Failed to log success:', logError);
            }
          }

          // Cache the response (if cache available)
          if (responseCache && typeof responseCache.set === 'function') {
            responseCache.set(request, response);
          }

          console.log(`[${requestId}] Success with provider: ${providerName}`);
          return response;

        } catch (error) {
          lastError = error as Error;
          providerUsed = providerName;
          
          // Record failed attempt (if logger available)
          if (apiUsageLogger && typeof apiUsageLogger.logFailure === 'function') {
            try {
              await apiUsageLogger.logFailure({
                userId: request.userId,
                featureName: 'ai_chat',
                provider: providerName,
                modelUsed: 'unknown',
                tokensInput: 0,
                tokensOutput: 0,
                latencyMs: Date.now() - startTime,
                cached: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                queryType: queryDetection.type,
                tierUsed: ALL_PROVIDERS[providerName].tier,
                fallbackUsed
              });
            } catch (logError) {
              console.warn('Failed to log failure:', logError);
            }
          }

          console.warn(`[${requestId}] Provider ${providerName} failed:`, error);
          
          // Mark provider as potentially unhealthy
          this.markProviderUnhealthy(providerName);
          
          // If this is not the first provider, mark as fallback used
          if (fallbackUsed === false) {
            fallbackUsed = true;
          }
        }
      }

      // Step 7: All providers failed, return graceful degradation
      const latency = Date.now() - startTime;
      const gracefulResponse: AIServiceManagerResponse = {
        content: this.getGracefulDegradationMessage(queryDetection.type),
        model_used: 'graceful_degradation',
        provider: 'system' as any,
        query_type: queryDetection.type,
        tier_used: 6,
        cached: false,
        tokens_used: { input: 0, output: 0 },
        latency_ms: latency,
        web_search_enabled: false,
        fallback_used: fallbackUsed,
        limit_approaching: false
      };

      // Log graceful degradation (if logger available)
      if (apiUsageLogger && typeof apiUsageLogger.logFailure === 'function') {
        try {
          await apiUsageLogger.logFailure({
            userId: request.userId,
            featureName: 'ai_chat',
            provider: 'system' as any,
            modelUsed: 'graceful_degradation',
            tokensInput: 0,
            tokensOutput: 0,
            latencyMs: latency,
            cached: false,
            errorMessage: 'All providers failed - graceful degradation',
            queryType: queryDetection.type,
            tierUsed: 6,
            fallbackUsed
          });
        } catch (logError) {
          console.warn('Failed to log graceful degradation:', logError);
        }
      }

      console.log(`[${requestId}] All providers failed, returning graceful degradation`);
      return gracefulResponse;

    } catch (error) {
      // Critical error handling
      const latency = Date.now() - startTime;
      console.error(`[${requestId}] AI Service Manager critical error:`, error);

      return {
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        model_used: 'error_handler',
        provider: 'system' as any,
        query_type: 'general',
        tier_used: 6,
        cached: false,
        tokens_used: { input: 0, output: 0 },
        latency_ms: latency,
        web_search_enabled: false,
        fallback_used: false,
        limit_approaching: false
      };
    }
  }

  /**
   * Detect query type from message content
   */
  private detectQueryType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Time-sensitive keywords
    const timeKeywords = ['current', 'latest', 'today', 'now', 'recent', 'news', 'update'];
    if (timeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'time_sensitive';
    }
    
    // App data keywords
    const appKeywords = ['progress', 'score', 'performance', 'study', 'grade', 'accuracy', 'completed'];
    if (appKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'app_data';
    }
    
    return 'general';
  }

  /**
   * Get available (healthy) providers for a query type
   */
  private getAvailableProviders(queryType: QueryType): AIProvider[] {
    const chain = DYNAMIC_FALLBACK_CHAINS[queryType] || ['groq', 'gemini'];
    return chain.filter(provider => {
      const config = ALL_PROVIDERS[provider];
      return config.healthy; // client instance is created on demand
    });
  }

  /**
   * Update provider health if needed
   */
  private async updateProviderHealthIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval || this.isCheckingHealth) {
      return;
    }

    this.isCheckingHealth = true;
    try {
      await this.performHealthCheck();
      this.lastHealthCheck = now;
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      this.isCheckingHealth = false;
    }
  }

  /**
   * Perform health check on all providers
   */
  private async performHealthCheck(): Promise<void> {
    console.log('Performing health check on all providers...');
    
    for (const [providerName, _config] of Object.entries(ALL_PROVIDERS)) {
      try {
        const startTime = Date.now();
        const tempClient = await this.createClientForProvider(providerName as any, null);
        await tempClient.healthCheck();
        const responseTime = Date.now() - startTime;
        
        const config = ALL_PROVIDERS[providerName as any];
        config.healthy = true;
        config.responseTime = responseTime;
        config.lastCheck = Date.now();
        
        console.log(`✅ ${providerName}: healthy (${responseTime}ms)`);
      } catch (error) {
        const config = ALL_PROVIDERS[providerName as any];
        config.healthy = false;
        config.lastCheck = Date.now();
        console.warn(`❌ ${providerName}: unhealthy - ${error}`);
      }
    }
    
    // Update fallback chains based on health
    this.updateFallbackChains();
  }

  /**
   * Update fallback chains to only include healthy providers
   */
  private updateFallbackChains(): void {
    const healthyProviders = Object.entries(ALL_PROVIDERS)
      .filter(([_, config]) => config.healthy && config.client !== null)
      .sort(([__, a], [___, b]) => a.tier - b.tier)
      .map(([provider]) => provider as AIProvider);
    
    console.log('Healthy providers:', healthyProviders.join(', '));
    
    // Update all chains to use only healthy providers
    for (const queryType of Object.keys(DYNAMIC_FALLBACK_CHAINS) as QueryType[]) {
      DYNAMIC_FALLBACK_CHAINS[queryType] = healthyProviders;
    }
  }

  /**
   * Mark provider as unhealthy
   */
  private markProviderUnhealthy(providerName: AIProvider): void {
    const config = ALL_PROVIDERS[providerName];
    if (config && config.client) {
      config.healthy = false;
      config.lastCheck = Date.now();
    }
  }

  /**
   * Call a specific provider
   */
  private async callProvider(params: {
    providerName: AIProvider;
    request: AIServiceManagerRequest;
    queryDetection: any;
    appDataContext?: AppDataContext;
    tier: number;
    requestId: string;
  }): Promise<AIServiceManagerResponse> {
    const { providerName, request, queryDetection, appDataContext, tier, requestId } = params;
    
    // Resolve per-user api key and construct client
const client = await this.createClientForProvider(providerName, request.userId);

    // Prepare messages
    const messages = this.prepareMessages(request, queryDetection, appDataContext);

    // Make the API call
    let response: AIServiceManagerResponse;
    
    switch (providerName) {
      case 'groq':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'groq'),
          webSearchEnabled: false
        });
        break;
        
      case 'gemini':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'gemini'),
          webSearchEnabled: false
        });
        break;
        
      case 'cerebras':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'cerebras')
        });
        break;
        
      case 'cohere':
        response = await client.chat({
          message: request.message,
          chatHistory: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
          model: this.getModelForQuery(queryDetection.type, 'cohere')
        });
        break;
        
      case 'mistral':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'mistral')
        });
        break;
        
      case 'openrouter':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'openrouter')
        });
        break;
        
      default:
        throw new Error(`Provider ${providerName} not implemented`);
    }

    // Update response with correct metadata
    response.tier_used = tier;
    response.query_type = queryDetection.type;
    response.web_search_enabled = false;

    // Record rate limit usage (if tracker available)
    if (rateLimitTracker && typeof rateLimitTracker.recordRequest === 'function') {
      rateLimitTracker.recordRequest(providerName, response.tokens_used.input + response.tokens_used.output);
    }

    return response;
  }

  /**
   * Prepare messages with context
   */
  private prepareMessages(
    request: AIServiceManagerRequest,
    queryDetection: any,
    appDataContext?: AppDataContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // System message
    let systemMessage = this.getSystemMessage(queryDetection.type, request.chatType);
    
    // Add app data context if available
    if (appDataContext) {
      systemMessage += `\n\nStudent Context:\n- Progress: ${appDataContext.studyProgress.completedBlocks}/${appDataContext.studyProgress.totalBlocks} blocks completed\n- Accuracy: ${appDataContext.studyProgress.accuracy}%`;
    }

    messages.push({
      role: 'system',
      content: systemMessage
    });

    // Add user message
    messages.push({
      role: 'user',
      content: request.message
    });

    return messages;
  }

  /**
   * Get appropriate model for query type and provider
   */
  private getModelForQuery(queryType: QueryType, provider: AIProvider): string {
    const modelMappings: Record<QueryType, Record<AIProvider, string>> = {
      time_sensitive: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-2.0-flash-lite',
        cerebras: 'llama-3.3-70b',
        cohere: 'command',
        mistral: 'mistral-large-latest',
        openrouter: 'openai/gpt-3.5-turbo',
        google: 'gemini-2.0-flash-lite'
      },
      app_data: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-2.5-flash',
        cerebras: 'llama-3.3-70b',
        cohere: 'command',
        mistral: 'mistral-medium-latest',
        openrouter: 'openai/gpt-3.5-turbo',
        google: 'gemini-2.5-flash'
      },
      general: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-2.5-flash',
        cerebras: 'llama-3.1-8b',
        cohere: 'command-light',
        mistral: 'mistral-small-latest',
        openrouter: 'openai/gpt-3.5-turbo',
        google: 'gemini-2.5-flash'
      }
    };

    return modelMappings[queryType]?.[provider] || 'default';
  }

  /**
   * Get system message based on query type
   */
  private getSystemMessage(queryType: QueryType, chatType: string): string {
    const baseMessage = chatType === 'study_assistant' 
      ? 'You are a helpful study assistant for BlockWise, an educational platform.'
      : 'You are a helpful AI assistant for BlockWise users.';

    switch (queryType) {
      case 'time_sensitive':
        return `${baseMessage} You excel at providing current, time-sensitive information and answers. Be concise and accurate.`;

      case 'app_data':
        return `${baseMessage} You help students analyze their study progress and performance data. Provide insights based on their activity and achievements.`;

      case 'general':
      default:
        return `${baseMessage} Provide helpful, accurate, and engaging responses to student questions.`;
    }
  }

  /**
   * Get app data context for a user
   */
  private async getAppDataContext(userId: string): Promise<AppDataContext> {
    // This would integrate with the actual app data
    // For now, return mock data - in production, fetch from Supabase
    return {
      userId,
      studyProgress: {
        totalBlocks: 50,
        completedBlocks: 35,
        accuracy: 78,
        subjectsStudied: ['Mathematics', 'Physics', 'Chemistry'],
        timeSpent: 120 // hours
      },
      recentActivity: {
        lastStudySession: new Date(),
        questionsAnswered: 245,
        correctAnswers: 191,
        topicsStruggled: ['Integration', 'Electromagnetism'],
        topicsStrong: ['Algebra', 'Mechanics']
      },
      preferences: {
        difficulty: 'intermediate',
        subjects: ['Mathematics', 'Physics'],
        studyGoals: ['Exam preparation', 'Concept clarity']
      }
    };
  }

  /**
   * Get graceful degradation message
   */
  private getGracefulDegradationMessage(queryType: QueryType): string {
    switch (queryType) {
      case 'time_sensitive':
        return 'I apologize, but I\'m unable to access current information right now. Please try again later or check official sources for the latest updates.';
      
      case 'app_data':
        return 'I\'m having trouble accessing your study data right now. Please try again in a moment, or check your dashboard for the latest progress updates.';
      
      case 'general':
      default:
        return 'I\'m experiencing high demand right now. Please try again in a few moments, and I\'ll be happy to help!';
    }
  }

  /**
   * Get system statistics
   */
  async getStatistics() {
    const healthyProviders = Object.entries(ALL_PROVIDERS)
      .filter(([_, config]) => config.healthy && config.client !== null)
      .map(([name, config]) => ({
        name,
        healthy: config.healthy,
        responseTime: config.responseTime,
        lastCheck: config.lastCheck
      }));

    return {
      providers: healthyProviders,
      fallbackChains: DYNAMIC_FALLBACK_CHAINS,
      totalProviders: Object.keys(ALL_PROVIDERS).length,
      healthyCount: healthyProviders.length
    };
  }

  /**
   * Manual health check trigger
   */
  async healthCheck(): Promise<Record<AIProvider, { healthy: boolean; responseTime: number; error?: string }>> {
    const results: Record<AIProvider, { healthy: boolean; responseTime: number; error?: string }> = {} as any;

    for (const [providerName, config] of Object.entries(ALL_PROVIDERS)) {
      // Skip providers without clients
      if (!config.client) {
        results[providerName as AIProvider] = {
          healthy: false,
          responseTime: 0,
          error: 'No client implementation'
        };
        continue;
      }

      try {
        const startTime = Date.now();
        await config.client.healthCheck();
        const responseTime = Date.now() - startTime;
        results[providerName as AIProvider] = {
          healthy: true,
          responseTime
        };
      } catch (error) {
        results[providerName as AIProvider] = {
          healthy: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager();

// Export the main processQuery function
export const processQuery = (request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> => {
  return aiServiceManager.processQuery(request);
};