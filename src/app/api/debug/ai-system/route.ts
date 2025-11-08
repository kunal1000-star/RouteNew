// AI System Debug API - Complete System Testing
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-unified';
import { aiDataService } from '@/lib/ai/ai-data-centralization-unified';
import { aiFeaturesEngine } from '@/lib/ai/ai-features-engine';
import { aiPerformanceMonitor } from '@/lib/ai/ai-performance-monitor';

// Import all provider clients for testing
import { groqClient } from '@/lib/ai/providers/groq-client';
import { geminiClient } from '@/lib/ai/providers/gemini-client';
import { cerebrasClient } from '@/lib/ai/providers/cerebras-client';
import { cohereClient } from '@/lib/ai/providers/cohere-client';
import { mistralClient } from '@/lib/ai/providers/mistral-client';
import { openRouterClient } from '@/lib/ai/providers/openrouter-client';

const DEBUG_TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

interface DebugTestRequest {
  testType: 'providers' | 'database' | 'centralized_service' | 'chat_flow' | 'features' | 'performance' | 'all';
  userId?: string;
  testMessage?: string;
}

interface DebugTestResult {
  testName: string;
  success: boolean;
  responseTime: number;
  data?: any;
  error?: string;
  details?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DebugTestRequest;
    const { testType, userId, testMessage } = body;

    const results: DebugTestResult[] = [];
    const startTime = Date.now();

    switch (testType) {
      case 'providers':
        results.push(...await testAllAIProviders());
        break;
      case 'database':
        results.push(...await testDatabaseConnections());
        break;
      case 'centralized_service':
        results.push(...await testCentralizedDataService(userId));
        break;
      case 'chat_flow':
        results.push(...await testChatFlow(userId, testMessage));
        break;
      case 'features':
        results.push(...await testAIFeaturesEngine(userId));
        break;
      case 'performance':
        results.push(...await testPerformanceMonitoring());
        break;
      case 'all':
        results.push(...await testAllSystems());
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type'
        }, { status: 400 });
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        testType,
        totalTests: results.length,
        successfulTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        totalTime,
        results
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Individual test functions
async function testAllAIProviders(): Promise<DebugTestResult[]> {
  const providers = [
    { name: 'Groq', client: groqClient },
    { name: 'Gemini', client: geminiClient },
    { name: 'Cerebras', client: cerebrasClient },
    { name: 'Cohere', client: cohereClient },
    { name: 'Mistral', client: mistralClient },
    { name: 'OpenRouter', client: openRouterClient }
  ];

  const results: DebugTestResult[] = [];

  for (const provider of providers) {
    const startTime = Date.now();
    try {
      if (!provider.client) {
        results.push({
          testName: `${provider.name} Provider`,
          success: false,
          responseTime: 0,
          error: 'Provider client not available'
        });
        continue;
      }

      const healthCheck = await provider.client.healthCheck();
      results.push({
        testName: `${provider.name} Provider`,
        success: healthCheck.healthy,
        responseTime: healthCheck.responseTime,
        data: {
          healthy: healthCheck.healthy,
          responseTime: healthCheck.responseTime,
          error: healthCheck.error
        },
        error: healthCheck.error
      });
    } catch (error) {
      results.push({
        testName: `${provider.name} Provider`,
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

async function testDatabaseConnections(): Promise<DebugTestResult[]> {
  const results: DebugTestResult[] = [];

  // Test basic database query
  const startTime = Date.now();
  try {
    const testProfile = await aiDataService.getAIUserProfile(DEBUG_TEST_USER_ID);
    results.push({
      testName: 'Database Connection',
      success: true,
      responseTime: Date.now() - startTime,
      data: {
        connected: true,
        profileData: testProfile ? 'Profile data available' : 'No profile data (expected for test user)'
      }
    });
  } catch (error) {
    results.push({
      testName: 'Database Connection',
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }

  return results;
}

async function testCentralizedDataService(userId?: string): Promise<DebugTestResult[]> {
  const results: DebugTestResult[] = [];
  const testUserId = userId || DEBUG_TEST_USER_ID;

  // Test AI user profile
  const startTime1 = Date.now();
  try {
    const profile = await aiDataService.getAIUserProfile(testUserId);
    results.push({
      testName: 'Centralized Data Service - User Profile',
      success: true,
      responseTime: Date.now() - startTime1,
      data: {
        profileFound: !!profile,
        cacheWorking: true,
        userId: testUserId
      }
    });
  } catch (error) {
    results.push({
      testName: 'Centralized Data Service - User Profile',
      success: false,
      responseTime: Date.now() - startTime1,
      error: error instanceof Error ? error.message : 'Failed to get user profile'
    });
  }

  // Test cache functionality
  const startTime2 = Date.now();
  try {
    const cacheStats = aiDataService.getCacheStats();
    results.push({
      testName: 'Cache System',
      success: true,
      responseTime: Date.now() - startTime2,
      data: cacheStats
    });
  } catch (error) {
    results.push({
      testName: 'Cache System',
      success: false,
      responseTime: Date.now() - startTime2,
      error: error instanceof Error ? error.message : 'Cache system error'
    });
  }

  return results;
}

async function testChatFlow(userId?: string, testMessage?: string): Promise<DebugTestResult[]> {
  const results: DebugTestResult[] = [];
  const testUserId = userId || DEBUG_TEST_USER_ID;
  const message = testMessage || 'Hello, this is a test message for debugging the AI system.';

  // Test AI Service Manager
  const startTime = Date.now();
  try {
    const response = await aiServiceManager.processQuery({
      userId: testUserId,
      conversationId: `debug-conversation-${Date.now()}`,
      message: message,
      chatType: 'general',
      includeAppData: false
    });

    results.push({
      testName: 'Chat Flow - AI Service Manager',
      success: true,
      responseTime: response.latency_ms,
      data: {
        provider: response.provider,
        model: response.model_used,
        contentLength: response.content.length,
        tokensUsed: response.tokens_used,
        cached: response.cached,
        fallbackUsed: response.fallback_used
      }
    });
  } catch (error) {
    results.push({
      testName: 'Chat Flow - AI Service Manager',
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Chat flow failed'
    });
  }

  return results;
}

async function testAIFeaturesEngine(userId?: string): Promise<DebugTestResult[]> {
  const results: DebugTestResult[] = [];
  const testUserId = userId || DEBUG_TEST_USER_ID;

  // Test features engine status
  const startTime = Date.now();
  try {
    const status = aiFeaturesEngine.getStatus();
    results.push({
      testName: 'AI Features Engine Status',
      success: true,
      responseTime: Date.now() - startTime,
      data: status
    });
  } catch (error) {
    results.push({
      testName: 'AI Features Engine Status',
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Features engine error'
    });
  }

  // Test individual feature
  const startTime2 = Date.now();
  try {
    const featureRequest = {
      featureId: 1, // Smart Topic Suggestions
      userId: testUserId,
      context: { testMode: true }
    };
    
    const featureResult = await aiFeaturesEngine.executeFeature(featureRequest);
    results.push({
      testName: 'AI Feature Execution',
      success: featureResult.success,
      responseTime: Date.now() - startTime2,
      data: {
        featureId: featureResult.featureId,
        success: featureResult.success,
        hasData: !!featureResult.data,
        metadata: featureResult.metadata
      },
      error: featureResult.error?.message
    });
  } catch (error) {
    results.push({
      testName: 'AI Feature Execution',
      success: false,
      responseTime: Date.now() - startTime2,
      error: error instanceof Error ? error.message : 'Feature execution failed'
    });
  }

  return results;
}

async function testPerformanceMonitoring(): Promise<DebugTestResult[]> {
  const results: DebugTestResult[] = [];

  // Test performance analytics
  const startTime = Date.now();
  try {
    const analytics = aiPerformanceMonitor.getPerformanceAnalytics('24h');
    results.push({
      testName: 'Performance Monitoring',
      success: true,
      responseTime: Date.now() - startTime,
      data: analytics
    });
  } catch (error) {
    results.push({
      testName: 'Performance Monitoring',
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Performance monitoring error'
    });
  }

  return results;
}

async function testAllSystems(): Promise<DebugTestResult[]> {
  const allResults: DebugTestResult[] = [];
  
  allResults.push(...await testAllAIProviders());
  allResults.push(...await testDatabaseConnections());
  allResults.push(...await testCentralizedDataService());
  allResults.push(...await testChatFlow());
  allResults.push(...await testAIFeaturesEngine());
  allResults.push(...await testPerformanceMonitoring());
  
  return allResults;
}

// GET endpoint for system status overview
export async function GET() {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        aiServiceManager: { available: true },
        aiDataService: { available: true },
        aiFeaturesEngine: { available: true },
        aiPerformanceMonitor: { available: true }
      },
      providers: {
        groq: { available: !!groqClient },
        gemini: { available: !!geminiClient },
        cerebras: { available: !!cerebrasClient },
        cohere: { available: !!cohereClient },
        mistral: { available: !!mistralClient },
        openrouter: { available: !!openRouterClient }
      }
    };

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Debug status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
