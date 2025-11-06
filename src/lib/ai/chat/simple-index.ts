// Simple TypeScript-compatible chat service index
// =============================================

import type { AIProvider } from '@/types/api-test';

export interface ChatServiceRequest {
  message: string;
  context?: any;
  preferences?: any;
  provider?: AIProvider;
  sessionId?: string;
  stream?: boolean;
}

export interface ChatServiceResponse {
  id: string;
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  timestamp: Date;
  metadata?: any;
}

export interface ChatServiceConfig {
  defaultProvider: string;
  fallbackProviders: string[];
  timeout: number;
  maxRetries: number;
}

export interface ProviderMetric {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  healthy: boolean;
}

/**
 * Mock chat service for fallback when TypeScript modules are unavailable
 */
class SimpleChatService {
  private providers: string[];
  private healthy: boolean;

  constructor() {
    this.providers = ['groq', 'cerebras', 'mistral', 'openrouter', 'gemini', 'cohere'];
    this.healthy = true;
    console.log('Simple chat service initialized');
  }

  async sendMessage(request: ChatServiceRequest): Promise<ChatServiceResponse> {
    // Simulate response time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: `simple-${Date.now()}`,
      content: `I understand you're asking about: "${request.message}". While the advanced AI chat service is being initialized, I'm here to help! This is a temporary response - the full AI features will be available soon.`,
      provider: 'simple-chat',
      model: 'fallback-v1',
      tokensUsed: 50,
      timestamp: new Date(),
      metadata: {
        fallbackMode: true,
        originalMessage: request.message
      }
    };
  }

  getConfig(): ChatServiceConfig {
    return {
      defaultProvider: 'groq',
      fallbackProviders: ['cerebras', 'mistral'],
      timeout: 30000,
      maxRetries: 3
    };
  }

  getProviderMetrics(): ProviderMetric[] {
    return this.providers.map(provider => ({
      provider,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      healthy: true
    }));
  }

  async getHealthCheck(): Promise<{ healthy: boolean; version: string; offlineMode: boolean }> {
    return {
      healthy: this.healthy,
      version: '1.0.0',
      offlineMode: false
    };
  }
}

// Singleton instance
let chatServiceInstance: SimpleChatService | null = null;

/**
 * Get or create chat service instance
 */
export function getChatService(): SimpleChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new SimpleChatService();
  }
  return chatServiceInstance;
}

/**
 * Initialize chat service (async wrapper)
 */
export async function getInitializedChatService(): Promise<SimpleChatService> {
  return getChatService();
}

/**
 * Reset chat service
 */
export function resetChatSystem(): void {
  chatServiceInstance = null;
  console.log('Chat system reset');
}

// Export the service class for direct use if needed
export { SimpleChatService };

// Default export for convenience
export default {
  getChatService,
  getInitializedChatService,
  resetChatSystem,
  SimpleChatService
};
