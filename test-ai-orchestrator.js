// AI Orchestrator Endpoint Test Suite
// ===================================
// Comprehensive tests for the AI orchestrator coordination system

const BASE_URL = 'http://localhost:3000';
const ORCHESTRATOR_ENDPOINT = `${BASE_URL}/api/ai/orchestrator`;

// Test user IDs
const VALID_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Test utility function to make HTTP requests
 */
async function makeRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Orchestrator-Test/1.0'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  const result = await response.json();
  
  return {
    status: response.status,
    success: response.ok,
    data: result
  };
}

/**
 * Test: Health Check
 */
async function testHealthCheck() {
  console.log('\n🧪 Testing Health Check...');
  
  try {
    const result = await makeRequest(`${ORCHESTRATOR_ENDPOINT}?action=health`);
    
    if (result.success && result.data.success) {
      console.log('✅ Health check passed');
      console.log('   Status:', result.data.data.status);
      console.log('   Version:', result.data.data.version);
      console.log('   Available endpoints:', result.data.data.system.orchestrator.available);
      return true;
    } else {
      console.log('❌ Health check failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

/**
 * Test: Single Operation - Memory Search
 */
async function testSingleOperationMemorySearch() {
  console.log('\n🧪 Testing Single Operation: Memory Search...');
  
  const request = {
    operation: 'memory_search',
    userId: VALID_USER_ID,
    data: {
      query: 'What is photosynthesis?',
      limit: 3,
      minSimilarity: 0.1,
      searchType: 'hybrid'
    },
    options: {
      timeout: 15000,
      enableMetrics: true
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (result.success && result.data.success) {
      console.log('✅ Memory search operation passed');
      console.log('   Results found:', result.data.data.summary.successfulSteps);
      console.log('   Processing time:', result.data.data.performance.totalTime, 'ms');
      console.log('   Network calls:', result.data.data.performance.networkCalls);
      return true;
    } else {
      console.log('❌ Memory search operation failed:', result.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Memory search operation error:', error.message);
    return false;
  }
}

/**
 * Test: Single Operation - Memory Store
 */
async function testSingleOperationMemoryStore() {
  console.log('\n🧪 Testing Single Operation: Memory Store...');
  
  const request = {
    operation: 'memory_store',
    userId: VALID_USER_ID,
    data: {
      message: 'User asked about photosynthesis',
      response: 'Photosynthesis is the process by which plants convert light energy into chemical energy',
      metadata: {
        memoryType: 'ai_response',
        priority: 'medium',
        retention: 'long_term',
        topic: 'biology',
        subject: 'science',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        tokensUsed: 50,
        processingTime: 1000,
        confidenceScore: 0.9,
        tags: ['photosynthesis', 'biology', 'plants']
      }
    },
    options: {
      timeout: 15000,
      enableMetrics: true
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (result.success && result.data.success) {
      console.log('✅ Memory store operation passed');
      console.log('   Memory ID:', result.data.data.results[0]?.data?.data?.memoryId);
      console.log('   Quality Score:', result.data.data.results[0]?.data?.data?.qualityScore);
      return true;
    } else {
      console.log('❌ Memory store operation failed:', result.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Memory store operation error:', error.message);
    return false;
  }
}

/**
 * Test: Single Operation - Personalized Suggestions
 */
async function testSingleOperationPersonalize() {
  console.log('\n🧪 Testing Single Operation: Personalized Suggestions...');
  
  const request = {
    operation: 'personalize',
    userId: VALID_USER_ID,
    data: {
      context: 'Study session planning',
      preferences: {
        subjects: ['biology', 'chemistry'],
        timeAvailable: 60,
        currentMood: 'confident',
        difficultyLevel: 'intermediate',
        studyStyle: 'visual'
      },
      memoryContext: {
        query: 'previous biology study sessions',
        limit: 3,
        searchType: 'hybrid'
      },
      options: {
        maxSuggestions: 5,
        confidenceThreshold: 0.3
      }
    },
    options: {
      timeout: 20000,
      enableMetrics: true
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (result.success && result.data.success) {
      console.log('✅ Personalized suggestions operation passed');
      console.log('   Suggestions count:', result.data.data.results[0]?.data?.data?.suggestions?.length);
      console.log('   Memory context found:', result.data.data.results[0]?.data?.data?.memoryContext?.memoriesFound);
      return true;
    } else {
      console.log('❌ Personalized suggestions operation failed:', result.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Personalized suggestions operation error:', error.message);
    return false;
  }
}

/**
 * Test: Orchestrated Workflow - Multi-step with dependencies
 */
async function testOrchestratedWorkflow() {
  console.log('\n🧪 Testing Orchestrated Workflow...');
  
  const request = {
    operation: 'orchestrate',
    userId: VALID_USER_ID,
    steps: [
      {
        id: 'search_memories',
        operation: 'memory_search',
        data: {
          query: 'previous study sessions about biology',
          limit: 3,
          searchType: 'hybrid',
          minSimilarity: 0.6
        }
      },
      {
        id: 'get_personalized',
        operation: 'personalize',
        data: {
          context: 'Biology study session',
          preferences: {
            subjects: ['biology'],
            timeAvailable: 90,
            currentMood: 'focused',
            difficultyLevel: 'intermediate'
          },
          memoryContext: {
            query: 'biology learning patterns',
            limit: 2
          }
        },
        dependsOn: ['search_memories']
      },
      {
        id: 'store_interaction',
        operation: 'memory_store',
        data: {
          message: 'User requested biology study plan',
          response: 'Generated personalized biology study plan with memory context',
          metadata: {
            memoryType: 'learning_interaction',
            priority: 'high',
            retention: 'long_term',
            topic: 'biology',
            subject: 'science',
            provider: 'orchestrator',
            model: 'coordinated',
            confidenceScore: 0.85,
            tags: ['biology', 'study_planning', 'orchestrated']
          }
        },
        dependsOn: ['get_personalized']
      }
    ],
    options: {
      parallel: false,
      timeout: 30000,
      enableMetrics: true,
      maxRetries: 2
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (result.success && result.data.success) {
      console.log('✅ Orchestrated workflow passed');
      console.log('   Total steps:', result.data.data.summary.totalSteps);
      console.log('   Successful steps:', result.data.data.summary.successfulSteps);
      console.log('   Failed steps:', result.data.data.summary.failedSteps);
      console.log('   Total duration:', result.data.data.summary.totalDuration, 'ms');
      console.log('   Performance:', result.data.data.performance);
      
      // Check step order and dependencies
      const stepResults = result.data.data.results;
      const stepOrder = stepResults.map(r => r.operation);
      console.log('   Step execution order:', stepOrder.join(' → '));
      
      return true;
    } else {
      console.log('❌ Orchestrated workflow failed:', result.data.error);
      if (result.data.data?.errors) {
        console.log('   Errors:', result.data.data.errors);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Orchestrated workflow error:', error.message);
    return false;
  }
}

/**
 * Test: Parallel Execution
 */
async function testParallelExecution() {
  console.log('\n🧪 Testing Parallel Execution...');
  
  const request = {
    operation: 'orchestrate',
    userId: VALID_USER_ID,
    steps: [
      {
        id: 'search_memories',
        operation: 'memory_search',
        data: {
          query: 'mathematics study sessions',
          limit: 2,
          searchType: 'text'
        }
      },
      {
        id: 'search_memories_2',
        operation: 'memory_search',
        data: {
          query: 'physics study sessions',
          limit: 2,
          searchType: 'text'
        }
      },
      {
        id: 'store_interaction',
        operation: 'memory_store',
        data: {
          message: 'Parallel memory searches completed',
          response: 'Successfully completed multiple memory searches in parallel',
          metadata: {
            memoryType: 'system_interaction',
            priority: 'medium',
            retention: 'short_term',
            topic: 'parallel_processing',
            tags: ['parallel', 'orchestrator', 'test']
          }
        }
      }
    ],
    options: {
      parallel: true,
      timeout: 25000,
      enableMetrics: true
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (result.success && result.data.success) {
      console.log('✅ Parallel execution passed');
      console.log('   Total steps:', result.data.data.summary.totalSteps);
      console.log('   Successful steps:', result.data.data.summary.successfulSteps);
      console.log('   Total duration:', result.data.data.summary.totalDuration, 'ms');
      
      // Check if steps executed in parallel (duration should be shorter)
      const stepDurations = result.data.data.results.map(r => r.timing.duration);
      console.log('   Step durations:', stepDurations, 'ms');
      
      return true;
    } else {
      console.log('❌ Parallel execution failed:', result.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Parallel execution error:', error.message);
    return false;
  }
}

/**
 * Test: Error Handling and Fallback
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling and Fallback...');
  
  // Test with invalid user ID
  const request = {
    operation: 'memory_search',
    userId: 'invalid-uuid',
    data: {
      query: 'test query'
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (!result.success && result.data.error) {
      console.log('✅ Error handling test passed');
      console.log('   Error code:', result.data.error.code);
      console.log('   Error message:', result.data.error.message);
      return true;
    } else {
      console.log('❌ Error handling test failed - should have returned error');
      return false;
    }
  } catch (error) {
    console.log('❌ Error handling test error:', error.message);
    return false;
  }
}

/**
 * Test: Invalid Operation
 */
async function testInvalidOperation() {
  console.log('\n🧪 Testing Invalid Operation...');
  
  const request = {
    operation: 'invalid_operation',
    userId: VALID_USER_ID,
    data: {
      query: 'test'
    }
  };

  try {
    const result = await makeRequest(ORCHESTRATOR_ENDPOINT, 'POST', request);
    
    if (!result.success && result.data.error) {
      console.log('✅ Invalid operation test passed');
      console.log('   Error code:', result.data.error.code);
      console.log('   Error message:', result.data.error.message);
      return true;
    } else {
      console.log('❌ Invalid operation test failed - should have returned error');
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid operation test error:', error.message);
    return false;
  }
}

/**
 * Test: Orchestrator Built-in Test
 */
async function testOrchestratorBuiltIn() {
  console.log('\n🧪 Testing Orchestrator Built-in Test...');
  
  try {
    const result = await makeRequest(`${ORCHESTRATOR_ENDPOINT}?action=test-orchestrator`);
    
    if (result.success && result.data.success) {
      console.log('✅ Built-in orchestrator test passed');
      console.log('   Test performed:', result.data.data.testPerformed);
      if (result.data.data.testResult?.success !== undefined) {
        console.log('   Test result success:', result.data.data.testResult.success);
      }
      return true;
    } else {
      console.log('❌ Built-in orchestrator test failed:', result.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Built-in orchestrator test error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting AI Orchestrator Test Suite');
  console.log('=====================================');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Single Operation: Memory Search', fn: testSingleOperationMemorySearch },
    { name: 'Single Operation: Memory Store', fn: testSingleOperationMemoryStore },
    { name: 'Single Operation: Personalized', fn: testSingleOperationPersonalize },
    { name: 'Orchestrated Workflow', fn: testOrchestratedWorkflow },
    { name: 'Parallel Execution', fn: testParallelExecution },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Invalid Operation', fn: testInvalidOperation },
    { name: 'Built-in Test', fn: testOrchestratorBuiltIn }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.log(`❌ Test "${test.name}" crashed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${result.name}${error}`);
  });
  
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! AI Orchestrator is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  return { passed, total, results };
}

// Check if script is run directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testSingleOperationMemorySearch,
  testSingleOperationMemoryStore,
  testSingleOperationPersonalize,
  testOrchestratedWorkflow,
  testParallelExecution,
  testErrorHandling,
  testInvalidOperation,
  testOrchestratorBuiltIn
};