// Performance Testing Framework for AI System
// ===========================================

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { aiServiceManager } from '../ai-service-manager';
import { responseCache } from '../response-cache';
import { rateLimitTracker } from '../rate-limit-tracker';
import { semanticSearch } from '../semantic-search';
import { studyBuddyCache } from '../study-buddy-cache';
import type { AIServiceManagerRequest, AIServiceManagerResponse } from '@/types/ai-service-manager';
import type { AIProvider } from '@/types/api-test';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  errorRate: number;
  tokensPerSecond: number;
}

interface LoadTestResult {
  metrics: PerformanceMetrics;
  errors: string[];
  timestamp: Date;
}

describe('Performance Testing Framework', () => {
  const testUserId = 'perf-test-user';
  const testConversationId = 'perf-test-conv';
  
  beforeAll(() => {
    // Clean up before performance tests
    responseCache.clear();
    studyBuddyCache.clear();
  });

  afterAll(() => {
    // Clean up after performance tests
    responseCache.clear();
    studyBuddyCache.clear();
  });

  describe('AI Service Manager Performance', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests: Promise<AIServiceManagerResponse>[] = [];
      
      const startTime = Date.now();
      
      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const request: AIServiceManagerRequest = {
          userId: `${testUserId}-${i}`,
          message: `Performance test message ${i}`,
          conversationId: `${testConversationId}-${i}`,
          chatType: 'general',
          includeAppData: false
        };
        
        requests.push(aiServiceManager.processQuery(request));
      }
      
      // Wait for all requests to complete
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const successfulRequests = responses.filter(r => r.status === 'fulfilled').length;
      const failedRequests = responses.filter(r => r.status === 'rejected').length;
      
      const metrics: PerformanceMetrics = {
        responseTime: totalTime / concurrentRequests,
        throughput: concurrentRequests / (totalTime / 1000),
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
        cacheHitRate: responseCache.getStatistics().hitRate,
        errorRate: failedRequests / concurrentRequests,
        tokensPerSecond: calculateTokensPerSecond(responses, totalTime)
      };
      
      // Performance assertions
      expect(metrics.responseTime).toBeLessThan(5000); // Average response time < 5s
      expect(metrics.throughput).toBeGreaterThan(1); // At least 1 request per second
      expect(metrics.errorRate).toBeLessThan(0.1); // Less than 10% error rate
      
      console.log('AI Service Manager Performance:', metrics);
    }, 60000); // 60 second timeout for load testing

    test('should maintain performance under rate limiting pressure', async () => {
      const requestsPerSecond = 5;
      const testDuration = 10000; // 10 seconds
      const requests: Promise<any>[] = [];
      
      const startTime = Date.now();
      const endTime = startTime + testDuration;
      
      // Generate requests at controlled rate
      while (Date.now() < endTime) {
        const request: AIServiceManagerRequest = {
          userId: testUserId,
          message: 'Rate limit performance test',
          conversationId: testConversationId,
          chatType: 'general',
          includeAppData: false
        };
        
        requests.push(aiServiceManager.processQuery(request));
        
        // Control rate
        await new Promise(resolve => setTimeout(resolve, 1000 / requestsPerSecond));
      }
      
      const responses = await Promise.allSettled(requests);
      const actualDuration = Date.now() - startTime;
      
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      const failedResponses = responses.filter(r => r.status === 'rejected');
      
      const metrics: PerformanceMetrics = {
        responseTime: calculateAverageResponseTime(successfulResponses),
        throughput: requests.length / (actualDuration / 1000),
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
        cacheHitRate: responseCache.getStatistics().hitRate,
        errorRate: failedResponses.length / responses.length,
        tokensPerSecond: calculateTokensPerSecond(responses, actualDuration)
      };
      
      // Performance should not degrade significantly under rate limiting
      expect(metrics.errorRate).toBeLessThan(0.2); // Less than 20% errors under load
      expect(metrics.throughput).toBeGreaterThan(requestsPerSecond * 0.7); // At least 70% of theoretical throughput
      
      console.log('Rate Limiting Performance:', metrics);
    }, 30000);
  });

  describe('Cache Performance Tests', () => {
    test('should demonstrate cache performance benefits', async () => {
      const cacheTestSize = 1000;
      const request: AIServiceManagerRequest = {
        userId: testUserId,
        message: 'Cache performance test message',
        conversationId: testConversationId,
        chatType: 'general',
        includeAppData: false
      };
      
      // Clear cache and measure first request (cache miss)
      responseCache.clear();
      const coldStartTime = Date.now();
      await aiServiceManager.processQuery(request);
      const coldResponseTime = Date.now() - coldStartTime;
      
      // Measure subsequent requests (cache hits)
      const hotStartTime = Date.now();
      for (let i = 0; i < cacheTestSize; i++) {
        responseCache.get(request); // Should be cache hits
      }
      const hotResponseTime = Date.now() - hotStartTime;
      
      const cachePerformance = {
        coldResponseTime,
        hotResponseTime,
        cacheHitRate: responseCache.getStatistics().hitRate,
        speedup: coldResponseTime / (hotResponseTime / cacheTestSize)
      };
      
      // Cache should provide significant performance improvement
      expect(cachePerformance.speedup).toBeGreaterThan(10); // At least 10x faster
      expect(cachePerformance.cacheHitRate).toBeGreaterThan(0.9); // 90%+ cache hit rate
      
      console.log('Cache Performance:', cachePerformance);
    });

    test('should handle cache eviction under memory pressure', async () => {
      const maxCacheSize = 500;
      const testEntries = 1000;
      
      // Fill cache beyond capacity
      for (let i = 0; i < testEntries; i++) {
        const key = `test-key-${i}`;
        const value = { data: `test-data-${i}`, timestamp: Date.now() };
        studyBuddyCache.set(key, value, { ttl: 60000 });
      }
      
      const finalSize = studyBuddyCache.size();
      const stats = studyBuddyCache.getStatistics();
      
      // Cache should evict entries when at capacity
      expect(finalSize).toBeLessThanOrEqual(maxCacheSize);
      expect(stats.evictions).toBeGreaterThan(0);
      
      console.log('Cache Eviction Test:', {
        initialSize: testEntries,
        finalSize,
        evictions: stats.evictions,
        hitRate: stats.hitRate
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory during extended operation', async () => {
      const initialMemory = process.memoryUsage();
      const operations = 100;
      
      // Perform memory-intensive operations
      for (let i = 0; i < operations; i++) {
        const request: AIServiceManagerRequest = {
          userId: `memory-test-${i}`,
          message: `Memory test message ${i} - Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua`,
          conversationId: `memory-test-conv-${i}`,
          chatType: 'study_assistant',
          includeAppData: true
        };
        
        await aiServiceManager.processQuery(request);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log('Memory Usage Test:', {
        initial: formatBytes(initialMemory.heapUsed),
        final: formatBytes(finalMemory.heapUsed),
        increase: formatBytes(memoryIncrease),
        operations
      });
    });

    test('should handle large context requests efficiently', async () => {
      const largeContextSizes = [1000, 5000, 10000]; // characters
      const results: any[] = [];
      
      for (const contextSize of largeContextSizes) {
        const largeMessage = 'A'.repeat(contextSize);
        const request: AIServiceManagerRequest = {
          userId: testUserId,
          message: largeMessage,
          conversationId: testConversationId,
          chatType: 'study_assistant',
          includeAppData: true
        };
        
        const startTime = Date.now();
        const initialMemory = process.memoryUsage();
        
        try {
          await aiServiceManager.processQuery(request);
          const endTime = Date.now();
          const finalMemory = process.memoryUsage();
          
          results.push({
            contextSize,
            responseTime: endTime - startTime,
            memoryIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
            success: true
          });
        } catch (error) {
          results.push({
            contextSize,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          });
        }
      }
      
      // Large contexts should either succeed within reasonable time or fail gracefully
      for (const result of results) {
        if (result.success) {
          expect(result.responseTime).toBeLessThan(10000); // Less than 10 seconds
          expect(result.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        }
      }
      
      console.log('Large Context Performance:', results);
    }, 120000); // 2 minute timeout for large context tests
  });

  describe('Database Integration Performance', () => {
    test('should perform semantic search efficiently', async () => {
      const searchQueries = [
        'thermodynamics concepts',
        'integration problems',
        'physics formulas',
        'chemistry reactions',
        'mathematics proofs'
      ];
      
      const searchResults: any[] = [];
      
      for (const query of searchQueries) {
        const startTime = Date.now();
        
        try {
          const result = await semanticSearch.searchMemories({
            userId: testUserId,
            query,
            limit: 10,
            minSimilarity: 0.7
          });
          
          const endTime = Date.now();
          
          searchResults.push({
            query,
            responseTime: endTime - startTime,
            resultsFound: result.memories.length,
            searchStats: result.searchStats,
            success: true
          });
        } catch (error) {
          searchResults.push({
            query,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          });
        }
      }
      
      // Semantic search should complete within reasonable time
      for (const result of searchResults) {
        if (result.success) {
          expect(result.responseTime).toBeLessThan(5000); // Less than 5 seconds
          expect(result.resultsFound).toBeGreaterThanOrEqual(0);
        }
      }
      
      console.log('Semantic Search Performance:', searchResults);
    });

    test('should handle concurrent database operations', async () => {
      const concurrentOperations = 20;
      const operations: Promise<any>[] = [];
      
      // Create concurrent database operations
      for (let i = 0; i < concurrentOperations; i++) {
        operations.push(
          semanticSearch.searchMemories({
            userId: `concurrent-user-${i}`,
            query: `concurrent query ${i}`,
            limit: 5
          })
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const performance = {
        totalTime: endTime - startTime,
        averageTime: (endTime - startTime) / concurrentOperations,
        successRate: successful / concurrentOperations,
        throughput: concurrentOperations / ((endTime - startTime) / 1000)
      };
      
      expect(performance.successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(performance.throughput).toBeGreaterThan(1); // At least 1 operation per second
      
      console.log('Concurrent Database Operations:', performance);
    }, 60000);
  });

  describe('Stress Testing', () => {
    test('should handle system stress gracefully', async () => {
      const stressDuration = 30000; // 30 seconds
      const requestsPerSecond = 10;
      const startTime = Date.now();
      
      const stressResults: LoadTestResult[] = [];
      
      // Run stress test
      while (Date.now() - startTime < stressDuration) {
        const batchStartTime = Date.now();
        const batch: Promise<any>[] = [];
        
        // Create batch of requests
        for (let i = 0; i < requestsPerSecond; i++) {
          const request: AIServiceManagerRequest = {
            userId: `stress-user-${Date.now()}`,
            message: 'Stress test message',
            conversationId: 'stress-conv',
            chatType: 'general',
            includeAppData: false
          };
          
          batch.push(aiServiceManager.processQuery(request));
        }
        
        try {
          const batchResults = await Promise.allSettled(batch);
          const batchEndTime = Date.now();
          
          const successful = batchResults.filter(r => r.status === 'fulfilled').length;
          const failed = batchResults.filter(r => r.status === 'rejected').length;
          
          stressResults.push({
            metrics: {
              responseTime: (batchEndTime - batchStartTime) / requestsPerSecond,
              throughput: requestsPerSecond,
              memoryUsage: process.memoryUsage().heapUsed,
              cpuUsage: process.cpuUsage().user,
              cacheHitRate: responseCache.getStatistics().hitRate,
              errorRate: failed / batchResults.length,
              tokensPerSecond: 0 // Calculate if needed
            },
            errors: batchResults
              .filter(r => r.status === 'rejected')
              .map(r => r.reason instanceof Error ? r.reason.message : 'Unknown error'),
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Batch processing failed:', error);
        }
        
        // Control rate
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Analyze stress test results
      const averageMetrics = calculateAverageMetrics(stressResults);
      const errorRate = stressResults.reduce((sum, result) => sum + result.metrics.errorRate, 0) / stressResults.length;
      
      // System should remain stable under stress
      expect(errorRate).toBeLessThan(0.3); // Less than 30% error rate
      expect(averageMetrics.throughput).toBeGreaterThan(requestsPerSecond * 0.5); // At least 50% of expected throughput
      
      console.log('Stress Test Results:', {
        duration: stressDuration,
        requestsPerSecond,
        totalBatches: stressResults.length,
        averageMetrics,
        errorRate
      });
    }, 120000); // 2 minute timeout for stress testing
  });
});

// Utility functions for performance testing
function calculateTokensPerSecond(responses: PromiseSettledResult<any>[], durationMs: number): number {
  const totalTokens = responses
    .filter(r => r.status === 'fulfilled')
    .reduce((sum, result) => {
      const tokens = (result as any).value?.tokens_used;
      return sum + (tokens?.input || 0) + (tokens?.output || 0);
    }, 0);
  
  return (totalTokens / durationMs) * 1000;
}

function calculateAverageResponseTime(successfulResponses: PromiseSettledResult<any>[]): number {
  if (successfulResponses.length === 0) return 0;
  
  return successfulResponses.reduce((sum, result) => {
    const latency = (result as any).value?.latency_ms || 0;
    return sum + latency;
  }, 0) / successfulResponses.length;
}

function calculateAverageMetrics(results: LoadTestResult[]): PerformanceMetrics {
  if (results.length === 0) {
    return {
      responseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      cacheHitRate: 0,
      errorRate: 1,
      tokensPerSecond: 0
    };
  }
  
  const totals = results.reduce((acc, result) => ({
    responseTime: acc.responseTime + result.metrics.responseTime,
    throughput: acc.throughput + result.metrics.throughput,
    memoryUsage: acc.memoryUsage + result.metrics.memoryUsage,
    cpuUsage: acc.cpuUsage + result.metrics.cpuUsage,
    cacheHitRate: acc.cacheHitRate + result.metrics.cacheHitRate,
    errorRate: acc.errorRate + result.metrics.errorRate,
    tokensPerSecond: acc.tokensPerSecond + result.metrics.tokensPerSecond
  }), {
    responseTime: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    cacheHitRate: 0,
    errorRate: 0,
    tokensPerSecond: 0
  });
  
  return {
    responseTime: totals.responseTime / results.length,
    throughput: totals.throughput / results.length,
    memoryUsage: totals.memoryUsage / results.length,
    cpuUsage: totals.cpuUsage / results.length,
    cacheHitRate: totals.cacheHitRate / results.length,
    errorRate: totals.errorRate / results.length,
    tokensPerSecond: totals.tokensPerSecond / results.length
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}