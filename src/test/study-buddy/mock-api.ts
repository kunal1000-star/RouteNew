// Mock API responses for testing
export const mockApiResponse = {
  success: true,
  data: {
    success: true,
    data: {}
  }
};

export const mockApiError = {
  success: false,
  error: 'Mock API error for testing'
};

// Mock fetch responses for different endpoints
export const mockEndpoints = {
  '/api/user/settings': {
    GET: (userId: string) => ({
      success: true,
      data: {
        success: true,
        data: {
          aiModel: {
            preferredProviders: ['groq', 'gemini', 'mistral'],
            qualitySettings: {
              responseQuality: 'balanced',
              temperature: 0.7
            },
            rateLimits: {
              dailyRequests: 1000,
              hourlyRequests: 100,
              concurrentRequests: 10
            }
          },
          studyBuddy: {
            endpoints: {
              chat: {
                provider: 'groq',
                model: 'llama3-8b-8192',
                enabled: true,
                timeout: 30,
                testStatus: 'success',
                lastTested: new Date().toISOString(),
                error: undefined
              },
              embeddings: {
                provider: 'gemini',
                model: 'gemini-2.0-flash',
                enabled: true,
                timeout: 45,
                testStatus: 'success',
                lastTested: new Date().toISOString(),
                error: undefined
              },
              memoryStorage: {
                provider: 'cerebras',
                model: 'llama3-8b',
                enabled: false,
                timeout: 30,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              orchestrator: {
                provider: 'mistral',
                model: 'mistral-small-latest',
                enabled: true,
                timeout: 60,
                testStatus: 'failed',
                lastTested: new Date().toISOString(),
                error: 'Connection timeout'
              },
              personalized: {
                provider: 'cohere',
                model: 'command-r',
                enabled: true,
                timeout: 35,
                testStatus: 'success',
                lastTested: new Date().toISOString(),
                error: undefined
              },
              semanticSearch: {
                provider: 'openrouter',
                model: 'llama3.1-8b',
                enabled: false,
                timeout: 40,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              webSearch: {
                provider: 'groq',
                model: 'llama3-70b-8192',
                enabled: true,
                timeout: 50,
                testStatus: 'success',
                lastTested: new Date().toISOString(),
                error: undefined
              }
            },
            globalDefaults: {
              provider: 'groq',
              model: 'llama3-8b-8192'
            },
            enableHealthMonitoring: true,
            testAllEndoints: true
          }
        }
      }
    }),
    PUT: (data: any) => ({
      success: true,
      data: {
        success: true,
        data: data.settings
      }
    })
  },
  
  '/api/user/settings/statistics': {
    GET: (userId: string) => ({
      success: true,
      data: {
        success: true,
        data: {
          totalSessions: 156,
          totalStudyTime: 7800,
          aiRequestsMade: 2340,
          studyStreak: {
            current: 12,
            longest: 25
          },
          tokenUsage: {
            byProvider: {
              groq: 45000,
              gemini: 32000,
              mistral: 28000,
              cerebras: 15000,
              cohere: 12000,
              openrouter: 8000
            },
            total: 140000,
            cost: 45.67
          },
          featureUsage: {
            chat: 85,
            embeddings: 65,
            memory: 45,
            search: 70
          }
        }
      }
    })
  },
  
  '/api/user/settings/reset': {
    POST: (userId: string) => ({
      success: true,
      data: {
        success: true,
        data: {
          aiModel: {
            preferredProviders: ['groq', 'gemini', 'mistral'],
            qualitySettings: {
              responseQuality: 'balanced',
              temperature: 0.7
            },
            rateLimits: {
              dailyRequests: 1000,
              hourlyRequests: 100,
              concurrentRequests: 10
            }
          },
          studyBuddy: {
            endpoints: {
              chat: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 30,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              embeddings: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 45,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              memoryStorage: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 30,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              orchestrator: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 60,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              personalized: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 35,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              semanticSearch: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 40,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              },
              webSearch: {
                provider: '',
                model: '',
                enabled: false,
                timeout: 50,
                testStatus: undefined,
                lastTested: undefined,
                error: undefined
              }
            },
            globalDefaults: {
              provider: '',
              model: ''
            },
            enableHealthMonitoring: false,
            testAllEndoints: false
          }
        }
      }
    })
  },
  
  '/api/user/settings/export': {
    GET: (userId: string) => ({
      success: true,
      data: {
        success: true,
        data: {
          settings: {
            aiModel: {
              preferredProviders: ['groq', 'gemini', 'mistral'],
              qualitySettings: {
                responseQuality: 'balanced',
                temperature: 0.7
              },
              rateLimits: {
                dailyRequests: 1000,
                hourlyRequests: 100,
                concurrentRequests: 10
              }
            },
            studyBuddy: {
              endpoints: {
                chat: {
                  provider: 'groq',
                  model: 'llama3-8b-8192',
                  enabled: true,
                  timeout: 30,
                  testStatus: 'success',
                  lastTested: new Date().toISOString(),
                  error: undefined
                },
                embeddings: {
                  provider: 'gemini',
                  model: 'gemini-2.0-flash',
                  enabled: true,
                  timeout: 45,
                  testStatus: 'success',
                  lastTested: new Date().toISOString(),
                  error: undefined
                }
              },
              globalDefaults: {
                provider: 'groq',
                model: 'llama3-8b-8192'
              }
            }
          }
        }
      }
    })
  }
};

// Helper function to create a mock fetch implementation
export const createMockFetch = (mockResponses: Record<string, any> = mockEndpoints) => {
  return jest.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;
    
    if (mockResponses[path]) {
      const endpoint = mockResponses[path];
      
      if (options?.method === 'GET') {
        const response = endpoint.GET?.(urlObj.searchParams.get('userId') || '');
        return {
          ok: response?.success || false,
          json: () => Promise.resolve(response)
        };
      }
      
      if (options?.method === 'PUT') {
        const data = JSON.parse(options.body as string);
        const response = endpoint.PUT?.(data);
        return {
          ok: response?.success || false,
          json: () => Promise.resolve(response)
        };
      }
      
      if (options?.method === 'POST') {
        const response = endpoint.POST?.(urlObj.searchParams.get('userId') || '');
        return {
          ok: response?.success || false,
          json: () => Promise.resolve(response)
        };
      }
    }
    
    // Default response for unmocked endpoints
    return {
      ok: true,
      json: () => Promise.resolve({ success: true })
    };
  });
};

// Mock endpoint testing responses
export const mockEndpointTestResponses = {
  success: {
    success: true,
    data: {
      status: 'online',
      responseTime: 245,
      model: 'llama3-8b-8192',
      provider: 'groq'
    }
  },
  
  failure: {
    success: false,
    error: 'Connection timeout after 5000ms'
  },
  
  invalidCredentials: {
    success: false,
    error: 'Invalid API key or credentials'
  },
  
  rateLimited: {
    success: false,
    error: 'Rate limit exceeded. Please try again later.'
  }
};

// Provider-specific model lists for testing
export const testProviderModels = {
  groq: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  cerebras: ['llama3-8b', 'llama3-70b'],
  cohere: ['command-r', 'command-r-plus', 'embed-english-v3.0'],
  mistral: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
  openrouter: ['llama3.1-8b', 'llama3.1-70b', 'nomic-embed-text-v1.5']
};

// Validation test cases
export const validationTestCases = {
  validProviderModelCombinations: [
    { provider: 'groq', model: 'llama3-8b-8192' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'mistral', model: 'mistral-small-latest' }
  ],
  
  invalidProviderModelCombinations: [
    { provider: 'groq', model: 'invalid-model' },
    { provider: 'unknown', model: 'any-model' },
    { provider: '', model: '' }
  ],
  
  validTimeoutValues: [5, 10, 30, 60, 90, 120],
  invalidTimeoutValues: [4, 121, -1, 0, 'invalid']
};