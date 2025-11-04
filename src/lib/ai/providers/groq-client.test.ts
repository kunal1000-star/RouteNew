// Groq Client Unit Tests
// =====================

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqClient } from './groq-client';
import type { AIServiceManagerResponse } from '@/types/ai-service-manager';

// Mock fetch for testing
global.fetch = vi.fn();

describe('GroqClient', () => {
  let client: GroqClient;
  const mockApiKey = 'test-groq-api-key';
  
  beforeEach(() => {
    vi.clearAllMocks();
    client = new GroqClient(mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct API key', () => {
      const testClient = new GroqClient(mockApiKey);
      expect(testClient).toBeInstanceOf(GroqClient);
    });

    test('should handle missing API key gracefully', () => {
      // Test with undefined API key - should not throw in constructor
      // but will throw when actually making requests
      const testClient = new GroqClient(undefined);
      expect(testClient).toBeInstanceOf(GroqClient);
    });
  });

  describe('Chat Functionality', () => {
    test('should make chat request with correct format', async () => {
      const mockMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ];

      const mockResponse = {
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! I am doing well, thank you for asking.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 12,
          total_tokens: 27
        }
      };

      // Mock successful response
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.chat({
        messages: mockMessages,
        model: 'llama-3.3-70b-versatile',
        webSearchEnabled: false
      });

      expect(result).toMatchObject({
        content: 'Hello! I am doing well, thank you for asking.',
        model_used: 'llama-3.3-70b-versatile',
        provider: 'groq',
        query_type: 'general',
        cached: false,
        tokens_used: {
          input: 15,
          output: 12
        },
        latency_ms: expect.any(Number),
        web_search_enabled: false,
        fallback_used: false,
        limit_approaching: false
      });
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key'
          }
        }),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile'
      })).rejects.toThrow();
    });

    test('should handle network failures', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile'
      })).rejects.toThrow('Network error');
    });
  });

  describe('Model Management', () => {
    test('should return available models', () => {
      const models = client.getAvailableModels();
      expect(models).toContain('llama-3.3-70b-versatile');
      expect(models).toContain('llama-3.1-70b-versatile');
      expect(models).toContain('mixtral-8x7b-32768');
    });
  });

  describe('Health Check', () => {
    test('should perform successful health check', async () => {
      const mockResponse = {
        id: 'chatcmpl-health',
        object: 'chat.completion',
        created: 1234567890,
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'OK'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 2,
          total_tokens: 3
        }
      };

      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const health = await client.healthCheck();
      
      expect(health).toEqual({
        healthy: true,
        responseTime: expect.any(Number)
      });
    });

    test('should handle health check failure', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Health check failed')
      );

      const health = await client.healthCheck();
      
      expect(health).toEqual({
        healthy: false,
        responseTime: expect.any(Number),
        error: 'Health check failed'
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should track API usage correctly', async () => {
      const mockResponse = {
        id: 'chatcmpl-usage',
        object: 'chat.completion',
        created: 1234567890,
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await client.chat({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'llama-3.3-70b-versatile'
      });

      // Verify the request was made with correct headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.groq.com/openai/v1/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle 429 rate limit errors', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: {
            message: 'Rate limit exceeded'
          }
        }),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile'
      })).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle 500 server errors', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile'
      })).rejects.toThrow();
    });

    test('should handle JSON parsing errors', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile'
      })).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Performance', () => {
    test('should measure response time accurately', async () => {
      const mockResponse = {
        id: 'chatcmpl-performance',
        object: 'chat.completion',
        created: 1234567890,
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Quick response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15
        }
      };

      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const startTime = Date.now();
      const result = await client.chat({
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'llama-3.3-70b-versatile'
      });
      const endTime = Date.now();

      expect(result.latency_ms).toBeGreaterThan(0);
      expect(result.latency_ms).toBeLessThanOrEqual(endTime - startTime + 10); // Small tolerance
    });
  });

  describe('Provider Info', () => {
    test('should return correct provider information', () => {
      const providerInfo = client.getProviderInfo();
      
      expect(providerInfo).toMatchObject({
        name: 'Groq',
        tier: 1,
        models: expect.arrayContaining(['llama-3.3-70b-versatile']),
        capabilities: {
          supportsStreaming: true,
          supportsFunctionCalling: true,
          supportsJsonMode: true,
          maxContextLength: 32768
        },
        rateLimits: {
          requestsPerMinute: 500,
          tokensPerMinute: 30000
        }
      });
    });

    test('should validate API key format', () => {
      expect(GroqClient.validateApiKey('gsk_valid_api_key_123456789')).toBe(true);
      expect(GroqClient.validateApiKey('invalid_key')).toBe(false);
      expect(GroqClient.validateApiKey('')).toBe(false);
      expect(GroqClient.validateApiKey('gsk_')).toBe(false);
    });
  });

  describe('Model Capabilities', () => {
    test('should return capabilities for supported models', () => {
      const capabilities = client.getModelCapabilities('llama-3.3-70b-versatile');
      
      expect(capabilities).toMatchObject({
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsJsonMode: true,
        maxTokens: 32768
      });
    });

    test('should return default capabilities for unsupported models', () => {
      const capabilities = client.getModelCapabilities('unknown-model');
      
      expect(capabilities).toMatchObject({
        supportsStreaming: true,
        supportsFunctionCalling: false,
        supportsJsonMode: false,
        maxTokens: 8192
      });
    });
  });
});