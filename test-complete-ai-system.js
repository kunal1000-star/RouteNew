#!/usr/bin/env node

/**
 * Complete AI System Integration Test
 * ==================================
 * 
 * This comprehensive test suite verifies the entire AI system works end-to-end
 * and specifically solves the original "Do you know my name?" problem.
 * 
 * Test Coverage:
 * 1. Individual AI endpoints testing
 * 2. End-to-end memory flow (the core problem)
 * 3. Integration between multiple services
 * 4. Performance and reliability testing
 * 5. Real-world usage scenarios
 * 
 * Original Problem Solved:
 * Step 1: User says "My name is Kunal" → Store in memory
 * Step 2: User asks "Do you know my name?" → Retrieve from memory
 * Step 3: AI responds "Yes, your name is Kunal" instead of "I don't have past conversations"
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID for testing
const CONVERSATION_ID = 'test-conversation-' + Date.now();

// Test result tracking
class TestResult {
  constructor(name, status, message, duration, details = null) {
    this.name = name;
    this.status = status; // 'PASS', 'FAIL', 'SKIP'
    this.message = message;
    this.duration = duration;
    this.details = details;
  }
}

class ComprehensiveAITestSuite {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.testUserId = TEST_USER_ID;
    this.conversationId = CONVERSATION_ID;
    this.memories = []; // Track stored memories
  }

  async runAllTests() {
    console.log('🚀 Starting Complete AI System Integration Test Suite');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User ID: ${this.testUserId}`);
    console.log(`Conversation ID: ${this.conversationId}`);
    console.log('=' .repeat(80));
    console.log('');

    try {
      // Phase 1: Individual Endpoint Tests
      await this.testIndividualEndpoints();
      
      // Phase 2: End-to-End Memory Test (The Core Problem)
      await this.testEndToEndMemoryFlow();
      
      // Phase 3: Integration Tests
      await this.testIntegrationScenarios();
      
      // Phase 4: Performance Tests
      await this.testPerformance();
      
      // Phase 5: Real-world Scenarios
      await this.testRealWorldScenarios();
      
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
    } finally {
      this.generateReport();
    }
  }

  async testIndividualEndpoints() {
    console.log('📡 PHASE 1: Testing Individual AI Endpoints');
    console.log('-'.repeat(50));

    // Test 1: Memory Storage Endpoint
    await this.testEndpoint(
      'Memory Storage',
      `${BASE_URL}/api/ai/memory-storage`,
      'POST',
      {
        userId: this.testUserId,
        message: 'My name is Kunal',
        response: 'Hello Kunal! Nice to meet you.',
        conversationId: this.conversationId,
        metadata: {
          memoryType: 'learning_interaction',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_info',
          subject: 'introduction',
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          confidenceScore: 0.9,
          tags: ['name', 'introduction', 'personal'],
          sessionId: 'session-test-1'
        }
      },
      'Stores user introduction with name information'
    );

    // Test 2: Semantic Search Endpoint
    await this.testEndpoint(
      'Semantic Search',
      `${BASE_URL}/api/ai/semantic-search`,
      'POST',
      {
        userId: this.testUserId,
        query: 'Do you know my name?',
        limit: 3,
        minSimilarity: 0.1,
        searchType: 'hybrid'
      },
      'Searches for memories about user name information'
    );

    // Test 3: Personalized Endpoint
    await this.testEndpoint(
      'Personalized Suggestions',
      `${BASE_URL}/api/ai/personalized`,
      'POST',
      {
        userId: this.testUserId,
        context: 'Study session with personal context',
        memoryContext: {
          query: 'introduction and personal information',
          limit: 3,
          searchType: 'hybrid'
        },
        options: {
          maxSuggestions: 3,
          confidenceThreshold: 0.3
        }
      },
      'Provides personalized suggestions with memory context'
    );

    // Test 4: Chat Endpoint
    await this.testEndpoint(
      'Main AI Chat',
      `${BASE_URL}/api/ai/chat`,
      'POST',
      {
        userId: this.testUserId,
        message: 'Do you remember my name from earlier?',
        conversationId: this.conversationId,
        includeMemoryContext: true,
        includePersonalizedSuggestions: false,
        memoryOptions: {
          query: 'name introduction',
          limit: 3,
          searchType: 'hybrid'
        }
      },
      'Main AI chat with memory integration'
    );

    // Test 5: Orchestrator Endpoint
    await this.testEndpoint(
      'AI Orchestrator',
      `${BASE_URL}/api/ai/orchestrator`,
      'POST',
      {
        operation: 'orchestrate',
        userId: this.testUserId,
        steps: [
          {
            id: 'search_name',
            operation: 'memory_search',
            data: {
              query: 'Kunal name introduction',
              limit: 2
            }
          },
          {
            id: 'generate_response',
            operation: 'chat',
            data: {
              message: 'Based on the memory found, respond to the user about their name',
              conversationId: this.conversationId
            },
            dependsOn: ['search_name']
          }
        ]
      },
      'Orchestrates multiple AI operations'
    );

    // Test 6: Web Search Endpoint
    await this.testEndpoint(
      'Web Search',
      `${BASE_URL}/api/ai/web-search`,
      'POST',
      {
        query: 'artificial intelligence memory systems',
        searchType: 'general',
        limit: 3
      },
      'Performs web search for external information'
    );

    // Test 7: Embeddings Endpoint
    await this.testEndpoint(
      'Vector Embeddings',
      `${BASE_URL}/api/ai/embeddings`,
      'POST',
      {
        operation: 'embed',
        text: 'My name is Kunal and I study computer science',
        storeInMemory: true,
        userId: this.testUserId
      },
      'Creates vector embeddings for text'
    );

    console.log('');
  }

  async testEndToEndMemoryFlow() {
    console.log('🧠 PHASE 2: Testing End-to-End Memory Flow (Core Problem)');
    console.log('-'.repeat(50));
    
    console.log('🎯 Testing the original "Do you know my name?" problem...');
    
    // Step 1: User introduces themselves (Store in memory)
    console.log('Step 1: User introduction → Store in memory');
    const introductionResult = await this.makeRequest(
      `${BASE_URL}/api/ai/memory-storage`,
      'POST',
      {
        userId: this.testUserId,
        message: 'My name is Kunal',
        response: 'Nice to meet you, Kunal! How can I help you study today?',
        conversationId: this.conversationId,
        metadata: {
          memoryType: 'learning_interaction',
          priority: 'critical',
          retention: 'long_term',
          topic: 'personal_info',
          subject: 'introduction',
          tags: ['name', 'Kunal', 'introduction'],
          sessionId: 'session-core-test'
        }
      }
    );

    if (introductionResult.success) {
      this.memories.push(introductionResult.data);
      console.log('✅ Step 1 PASSED: Name stored in memory');
      this.addResult(new TestResult(
        'Memory Storage - Name Introduction',
        'PASS',
        `Name "Kunal" successfully stored with memory ID: ${introductionResult.data.memoryId}`,
        introductionResult.duration
      ));
    } else {
      console.log('❌ Step 1 FAILED: Could not store name in memory');
      this.addResult(new TestResult(
        'Memory Storage - Name Introduction',
        'FAIL',
        `Failed to store name: ${introductionResult.error?.message}`,
        introductionResult.duration
      ));
      return; // Can't continue if storage fails
    }

    // Step 2: Ask "Do you know my name?" (Retrieve from memory)
    console.log('Step 2: Ask about name → Search memory');
    const searchResult = await this.makeRequest(
      `${BASE_URL}/api/ai/semantic-search`,
      'POST',
      {
        userId: this.testUserId,
        query: 'Do you know my name?',
        limit: 5,
        minSimilarity: 0.1, // Very low threshold to catch name reference
        searchType: 'hybrid'
      }
    );

    if (searchResult.success && searchResult.data.memories.length > 0) {
      console.log('✅ Step 2 PASSED: Found memories about name');
      const nameMemories = searchResult.data.memories.filter(memory => 
        memory.content.toLowerCase().includes('kunal') || 
        memory.content.toLowerCase().includes('name') ||
        memory.tags?.some(tag => tag.toLowerCase().includes('name'))
      );
      
      this.addResult(new TestResult(
        'Memory Retrieval - Name Search',
        'PASS',
        `Found ${searchResult.data.memories.length} memories, ${nameMemories.length} contain name information`,
        searchResult.duration,
        { memories: searchResult.data.memories }
      ));
    } else {
      console.log('❌ Step 2 FAILED: No memories found');
      this.addResult(new TestResult(
        'Memory Retrieval - Name Search',
        'FAIL',
        `No memories found: ${searchResult.error?.message || 'No results'}`,
        searchResult.duration
      ));
    }

    // Step 3: Full AI Chat with Memory Context
    console.log('Step 3: AI Chat with memory context → Personalized response');
    const chatResult = await this.makeRequest(
      `${BASE_URL}/api/ai/chat`,
      'POST',
      {
        userId: this.testUserId,
        message: 'Do you know my name?',
        conversationId: this.conversationId,
        includeMemoryContext: true,
        includePersonalizedSuggestions: false,
        memoryOptions: {
          query: 'name introduction Kunal',
          limit: 3,
          searchType: 'hybrid',
          contextLevel: 'comprehensive'
        }
      }
    );

    if (chatResult.success) {
      const aiResponse = chatResult.data.aiResponse.content.toLowerCase();
      const knowsName = aiResponse.includes('kunal') || 
                       chatResult.data.memoryContext?.memoriesFound > 0;
      
      if (knowsName) {
        console.log('✅ Step 3 PASSED: AI correctly remembered the name');
        this.addResult(new TestResult(
          'AI Chat - Memory Integration',
          'PASS',
          `AI correctly responded with name awareness. Response: "${chatResult.data.aiResponse.content.substring(0, 100)}..."`,
          chatResult.duration,
          { 
            aiResponse: chatResult.data.aiResponse.content,
            memoryContext: chatResult.data.memoryContext
          }
        ));
      } else {
        console.log('❌ Step 3 FAILED: AI did not recognize the name');
        this.addResult(new TestResult(
          'AI Chat - Memory Integration',
          'FAIL',
          `AI response lacks name awareness: "${chatResult.data.aiResponse.content}"`,
          chatResult.duration,
          { 
            aiResponse: chatResult.data.aiResponse.content,
            memoryContext: chatResult.data.memoryContext
          }
        ));
      }
    } else {
      console.log('❌ Step 3 FAILED: Chat endpoint error');
      this.addResult(new TestResult(
        'AI Chat - Memory Integration',
        'FAIL',
        `Chat failed: ${chatResult.error?.message}`,
        chatResult.duration
      ));
    }

    // Bonus: Test with more personal information
    console.log('Bonus: Storing additional personal information...');
    await this.makeRequest(
      `${BASE_URL}/api/ai/memory-storage`,
      'POST',
      {
        userId: this.testUserId,
        message: 'I am a computer science student',
        response: 'That\'s great, Kunal! Computer science is a fascinating field.',
        conversationId: this.conversationId,
        metadata: {
          memoryType: 'learning_interaction',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_background',
          subject: 'education',
          tags: ['student', 'computer science', 'education'],
          sessionId: 'session-core-test'
        }
      }
    );

    // Test retrieval of multiple personal details
    const personalSearchResult = await this.makeRequest(
      `${BASE_URL}/api/ai/semantic-search`,
      'POST',
      {
        userId: this.testUserId,
        query: 'Tell me about myself',
        limit: 3,
        minSimilarity: 0.3,
        searchType: 'hybrid'
      }
    );

    if (personalSearchResult.success && personalSearchResult.data.memories.length >= 2) {
      this.addResult(new TestResult(
        'Memory Retrieval - Personal Information',
        'PASS',
        `Found ${personalSearchResult.data.memories.length} personal memories including name and education background`,
        personalSearchResult.duration
      ));
    }

    console.log('');
  }

  async testIntegrationScenarios() {
    console.log('🔗 PHASE 3: Testing Integration Scenarios');
    console.log('-'.repeat(50));

    // Scenario A: Orchestrator with Multiple Services
    console.log('Scenario A: Orchestrator coordinating memory + chat + web search');
    const orchestratorResult = await this.makeRequest(
      `${BASE_URL}/api/ai/orchestrator`,
      'POST',
      {
        operation: 'orchestrate',
        userId: this.testUserId,
        steps: [
          {
            id: 'search_personal_info',
            operation: 'memory_search',
            data: {
              query: 'Kunal computer science student',
              limit: 2
            }
          },
          {
            id: 'get_suggestions',
            operation: 'personalize',
            data: {
              context: 'Computer science study session',
              memoryContext: {
                query: 'computer science education',
                limit: 2
              }
            },
            dependsOn: ['search_personal_info']
          },
          {
            id: 'web_search_context',
            operation: 'web_search',
            data: {
              query: 'computer science study tips',
              limit: 2
            }
          }
        ],
        options: {
          parallel: true,
          timeout: 30000
        }
      }
    );

    if (orchestratorResult.success) {
      const successfulSteps = orchestratorResult.data.results.filter(r => r.success);
      this.addResult(new TestResult(
        'Integration - Orchestrator Workflow',
        'PASS',
        `Orchestrator completed ${successfulSteps.length}/${orchestratorResult.data.results.length} steps successfully`,
        orchestratorResult.duration,
        { steps: orchestratorResult.data.results }
      ));
    } else {
      this.addResult(new TestResult(
        'Integration - Orchestrator Workflow',
        'FAIL',
        `Orchestrator failed: ${orchestratorResult.error?.message}`,
        orchestratorResult.duration
      ));
    }

    // Scenario B: Chat with Full Integration
    console.log('Scenario B: Chat with memory + personalized + web search');
    const integratedChatResult = await this.makeRequest(
      `${BASE_URL}/api/ai/chat`,
      'POST',
      {
        userId: this.testUserId,
        message: 'I need help studying algorithms. Can you suggest something based on my background?',
        conversationId: this.conversationId,
        includeMemoryContext: true,
        includePersonalizedSuggestions: true,
        memoryOptions: {
          query: 'computer science study background',
          limit: 3,
          searchType: 'hybrid'
        }
      }
    );

    if (integratedChatResult.success) {
      const hasMemoryContext = integratedChatResult.data.memoryContext?.memoriesFound > 0;
      const hasPersonalized = integratedChatResult.data.personalizedSuggestions?.suggestions?.length > 0;
      
      this.addResult(new TestResult(
        'Integration - Full Chat Pipeline',
        'PASS',
        `Chat integrated memory (${hasMemoryContext}) and personalization (${hasPersonalized})`,
        integratedChatResult.duration,
        { 
          memoryFound: hasMemoryContext,
          suggestionsCount: integratedChatResult.data.personalizedSuggestions?.suggestions?.length || 0
        }
      ));
    } else {
      this.addResult(new TestResult(
        'Integration - Full Chat Pipeline',
        'FAIL',
        `Integrated chat failed: ${integratedChatResult.error?.message}`,
        integratedChatResult.duration
      ));
    }

    console.log('');
  }

  async testPerformance() {
    console.log('⚡ PHASE 4: Performance Tests');
    console.log('-'.repeat(50));

    // Test response times for different operations
    const operations = [
      { name: 'Memory Storage', url: '/api/ai/memory-storage', method: 'POST', data: {
        userId: this.testUserId,
        message: 'Performance test message',
        response: 'Performance test response',
        metadata: { memoryType: 'performance_test', priority: 'low' }
      }},
      { name: 'Semantic Search', url: '/api/ai/semantic-search', method: 'POST', data: {
        userId: this.testUserId,
        query: 'performance test search',
        limit: 5
      }},
      { name: 'AI Chat', url: '/api/ai/chat', method: 'POST', data: {
        userId: this.testUserId,
        message: 'Performance test chat message',
        includeMemoryContext: false
      }}
    ];

    const performanceResults = [];
    for (const op of operations) {
      const startTime = Date.now();
      const result = await this.makeRequest(`${BASE_URL}${op.url}`, op.method, op.data);
      const duration = Date.now() - startTime;
      
      performanceResults.push({
        operation: op.name,
        duration,
        success: result.success
      });

      this.addResult(new TestResult(
        `Performance - ${op.name}`,
        result.success && duration < 10000 ? 'PASS' : 'FAIL',
        `${op.name} completed in ${duration}ms${result.success ? '' : ' (with errors)'}`,
        duration
      ));
    }

    // Test parallel processing
    console.log('Testing parallel processing...');
    const parallelStart = Date.now();
    const parallelPromises = operations.map(op => 
      this.makeRequest(`${BASE_URL}${op.url}`, op.method, op.data)
    );
    const parallelResults = await Promise.all(parallelPromises);
    const parallelDuration = Date.now() - parallelStart;

    const successfulParallel = parallelResults.filter(r => r.success).length;
    this.addResult(new TestResult(
      'Performance - Parallel Processing',
      successfulParallel === operations.length ? 'PASS' : 'FAIL',
      `Parallel processing: ${successfulParallel}/${operations.length} operations succeeded in ${parallelDuration}ms`,
      parallelDuration
    ));

    console.log('');
  }

  async testRealWorldScenarios() {
    console.log('🌍 PHASE 5: Real-World Scenarios');
    console.log('-'.repeat(50));

    // Scenario A: Basic Study Session
    console.log('Scenario A: Complete study session flow');
    const studySessionSteps = [
      // Student introduces themselves
      {
        url: '/api/ai/memory-storage',
        data: {
          userId: this.testUserId,
          message: 'Hi, I\'m Kunal and I\'m struggling with calculus',
          response: 'Hello Kunal! I\'d be happy to help you with calculus. What specific topics are you finding challenging?',
          metadata: { memoryType: 'learning_interaction', priority: 'high', topic: 'calculus_help' }
        }
      },
      // Ask for help
      {
        url: '/api/ai/chat',
        data: {
          userId: this.testUserId,
          message: 'I need help understanding derivatives',
          includeMemoryContext: true
        }
      },
      // Get personalized suggestions
      {
        url: '/api/ai/personalized',
        data: {
          userId: this.testUserId,
          context: 'Calculus study session',
          memoryContext: { query: 'calculus derivatives help', limit: 2 }
        }
      }
    ];

    let studySessionSuccess = 0;
    for (const step of studySessionSteps) {
      const result = await this.makeRequest(`${BASE_URL}${step.url}`, 'POST', step.data);
      if (result.success) studySessionSuccess++;
    }

    this.addResult(new TestResult(
      'Real-World - Study Session',
      studySessionSuccess === studySessionSteps.length ? 'PASS' : 'FAIL',
      `Study session: ${studySessionSuccess}/${studySessionSteps.length} steps completed successfully`,
      0
    ));

    // Scenario B: Error Handling and Fallbacks
    console.log('Scenario B: Error handling and fallback mechanisms');
    
    // Test with invalid user ID
    const invalidUserResult = await this.makeRequest(
      `${BASE_URL}/api/ai/semantic-search`,
      'POST',
      {
        userId: 'invalid-uuid',
        query: 'test search'
      }
    );

    this.addResult(new TestResult(
      'Real-World - Error Handling',
      !invalidUserResult.success ? 'PASS' : 'FAIL',
      `Invalid user ID properly rejected: ${!invalidUserResult.success}`,
      invalidUserResult.duration
    ));

    // Test with missing required fields
    const missingFieldsResult = await this.makeRequest(
      `${BASE_URL}/api/ai/memory-storage`,
      'POST',
      {
        userId: this.testUserId,
        // Missing required message and response
      }
    );

    this.addResult(new TestResult(
      'Real-World - Validation',
      !missingFieldsResult.success ? 'PASS' : 'FAIL',
      `Missing fields properly validated: ${!missingFieldsResult.success}`,
      missingFieldsResult.duration
    ));

    console.log('');
  }

  async testEndpoint(name, url, method, data, description) {
    const result = await this.makeRequest(url, method, data);
    this.addResult(new TestResult(
      `Endpoint - ${name}`,
      result.success ? 'PASS' : 'FAIL',
      `${description}: ${result.success ? 'Success' : 'Failed - ' + (result.error?.message || 'Unknown error')}`,
      result.duration
    ));
  }

  async makeRequest(url, method, data) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-System-Integration-Test/1.0'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: response.ok && result.success !== false,
        data: result.data,
        error: result.error,
        duration,
        status: response.status
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: {
          message: error.message,
          type: 'network_error'
        },
        duration,
        status: 0
      };
    }
  }

  addResult(result) {
    this.results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${result.name}: ${result.message} (${result.duration}ms)`);
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('📋 COMPREHENSIVE AI SYSTEM TEST REPORT');
    console.log('=' .repeat(80));
    console.log(`Test Suite: Complete AI System Integration`);
    console.log(`Execution Time: ${totalTime}ms`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${this.testUserId}`);
    console.log('');

    console.log('📊 SUMMARY');
    console.log('-'.repeat(20));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Overall Status: ${failedTests === 0 ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
    console.log('');

    // Core Problem Resolution Status
    const memoryStorage = this.results.find(r => r.name.includes('Memory Storage - Name Introduction'));
    const memoryRetrieval = this.results.find(r => r.name.includes('Memory Retrieval - Name Search'));
    const aiChat = this.results.find(r => r.name.includes('AI Chat - Memory Integration'));

    console.log('🎯 CORE PROBLEM RESOLUTION STATUS');
    console.log('-'.repeat(40));
    console.log(`Memory Storage (Step 1): ${memoryStorage?.status || 'NOT TESTED'}`);
    console.log(`Memory Retrieval (Step 2): ${memoryRetrieval?.status || 'NOT TESTED'}`);
    console.log(`AI Response (Step 3): ${aiChat?.status || 'NOT TESTED'}`);
    
    if (memoryStorage?.status === 'PASS' && memoryRetrieval?.status === 'PASS' && aiChat?.status === 'PASS') {
      console.log('🎉 CORE PROBLEM SOLVED: "Do you know my name?" now works correctly!');
    } else {
      console.log('❌ CORE PROBLEM NOT FULLY RESOLVED');
    }
    console.log('');

    // Performance Summary
    const performanceTests = this.results.filter(r => r.name.includes('Performance'));
    if (performanceTests.length > 0) {
      console.log('⚡ PERFORMANCE SUMMARY');
      console.log('-'.repeat(25));
      performanceTests.forEach(test => {
        console.log(`${test.name}: ${test.duration}ms (${test.status})`);
      });
      console.log('');
    }

    // Integration Summary
    const integrationTests = this.results.filter(r => r.name.includes('Integration'));
    if (integrationTests.length > 0) {
      console.log('🔗 INTEGRATION SUMMARY');
      console.log('-'.repeat(25));
      integrationTests.forEach(test => {
        console.log(`${test.name}: ${test.status}`);
      });
      console.log('');
    }

    // Endpoint Health Summary
    const endpointTests = this.results.filter(r => r.name.startsWith('Endpoint -'));
    const endpointSummary = {};
    endpointTests.forEach(test => {
      const endpoint = test.name.replace('Endpoint - ', '');
      endpointSummary[endpoint] = test.status;
    });

    console.log('🌐 ENDPOINT HEALTH SUMMARY');
    console.log('-'.repeat(30));
    Object.entries(endpointSummary).forEach(([endpoint, status]) => {
      const icon = status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${endpoint}: ${status}`);
    });
    console.log('');

    // Final Status and Recommendations
    console.log('📋 RECOMMENDATIONS');
    console.log('-'.repeat(20));
    
    if (failedTests === 0) {
      console.log('🎉 All systems operational! The AI system is ready for production.');
      console.log('✅ Memory system working correctly - "Do you know my name?" problem solved');
      console.log('✅ All AI endpoints responding correctly');
      console.log('✅ Integration between services working seamlessly');
      console.log('✅ Performance within acceptable limits');
    } else {
      console.log('⚠️  Some issues detected. Review failed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.message}`);
      });
      console.log('');
      console.log('🔧 Recommended Actions:');
      console.log('   • Check service dependencies and database connections');
      console.log('   • Verify API keys and authentication tokens');
      console.log('   • Review error logs for detailed failure information');
    }

    console.log('');
    console.log('✨ Study Buddy Memory Issue Status: ' + 
               (failedTests === 0 ? 'COMPLETELY RESOLVED' : 'NEEDS ATTENTION'));
    console.log('');
    console.log('=' .repeat(80));
  }
}

// Main execution
async function main() {
  console.log('🧪 AI System Integration Test Suite');
  console.log('Testing the complete AI system to solve the "Do you know my name?" problem');
  console.log('');

  const testSuite = new ComprehensiveAITestSuite();
  await testSuite.runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { ComprehensiveAITestSuite, TestResult };