// Simple JavaScript-compatible chat service index
// =============================================

/**
 * Mock chat service for fallback when TypeScript modules are unavailable
 */
class SimpleChatService {
  constructor() {
    this.providers = ['groq', 'cerebras', 'mistral', 'openrouter', 'gemini', 'cohere'];
    this.healthy = true;
    console.log('Simple chat service initialized');
  }

  async sendMessage(request) {
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

  getConfig() {
    return {
      defaultProvider: 'groq',
      fallbackProviders: ['cerebras', 'mistral'],
      timeout: 30000,
      maxRetries: 3
    };
  }

  getProviderMetrics() {
    return this.providers.map(provider => ({
      provider,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      healthy: true
    }));
  }
}

// Singleton instance
let chatServiceInstance = null;

/**
 * Get or create chat service instance
 */
function getChatService() {
  if (!chatServiceInstance) {
    chatServiceInstance = new SimpleChatService();
  }
  return chatServiceInstance;
}

/**
 * Initialize chat service (async wrapper)
 */
async function getInitializedChatService() {
  return getChatService();
}

/**
 * Reset chat service
 */
function resetChatSystem() {
  chatServiceInstance = null;
  console.log('Chat system reset');
}

// Export functions for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getChatService,
    getInitializedChatService,
    resetChatSystem,
    SimpleChatService
  };
}