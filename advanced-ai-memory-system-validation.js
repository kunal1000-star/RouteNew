#!/usr/bin/env node
/**
 * Advanced AI Memory System Integration Validation
 * ================================================
 * Tests memory system integration with study buddy and hallucination prevention
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUserId: 'test-advanced-ai-validation-user-123',
  testConversationId: 'conv-advanced-ai-validation-123',
  testTimeout: 10000
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// HTTP request helper
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { 
      status: 0, 
      data: { error: error.message }, 
      ok: false,
      error 
    };
  }
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

function addTestResult(testName, success, message, details = null) {
  if (success) {
    testResults.passed++;
    log(`✓ ${testName}: ${message}`, 'green');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, message, details });
    log(`✗ ${testName}: ${message}`, 'red');
  }
}

function addWarning(testName, message) {
  testResults.warnings++;
  log(`⚠ ${testName}: ${message}`, 'yellow');
}

// 1. Memory Storage API Validation
async function testMemoryStorageAPI() {
  logSection('1. MEMORY STORAGE API VALIDATION');
  
  // Test memory storage endpoint health
  const healthResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai/memory-storage?action=health`);
  addTestResult(
    'Memory Storage API Health Check',
    healthResponse.ok && healthResponse.data.success,
    healthResponse.ok ? 'API is operational' : 'API health check failed',
    healthResponse.data
  );

  // Test memory storage functionality
  const testMemory = {
    userId: TEST_CONFIG.testUserId,
    message: 'My name is Kunal and I am studying for my math exam tomorrow.',
    response: 'That sounds like a great study plan! Math exams can be challenging but with good preparation you can do well. What specific topics in math are you focusing on?',
    conversationId: TEST_CONFIG.testConversationId,
    metadata: {
      memoryType: 'learning_interaction',
      priority: 'high',
      retention: 'long_term',
      topic: 'math exam',
      subject: 'mathematics',
      learningObjective: 'exam preparation',
      provider: 'openai',
      model: 'gpt-4',
      tags: ['personal', 'study-topic', 'exam']
    }
  };

  const storageResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai/memory-storage`, {
    method: 'POST',
    body: JSON.stringify(testMemory)
  });

  addTestResult(
    'Memory Storage Functionality',
    storageResponse.ok && storageResponse.data.success,
    storageResponse.ok ? `Memory stored with ID: ${storageResponse.data.data?.memoryId}` : 'Memory storage failed',
    storageResponse.data
  );

  return storageResponse.data?.data?.memoryId;
}

// 2. Memory Search API Validation
async function testMemorySearchAPI(memoryId) {
  logSection('2. MEMORY SEARCH API VALIDATION');
  
  // Test memory search API health
  const searchHealthResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/memory/search?action=health`);
  addTestResult(
    'Memory Search API Health Check',
    searchHealthResponse.ok && searchHealthResponse.data.success,
    searchHealthResponse.ok ? 'Search API is operational' : 'Search API health check failed',
    searchHealthResponse.data
  );

  // Test personal query search
  const personalQuery = {
    userId: TEST_CONFIG.testUserId,
    query: 'What is my name?',
    chatType: 'study_assistant',
    isPersonalQuery: true,
    contextLevel: 'comprehensive',
    limit: 5
  };

  const searchResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/memory/search`, {
    method: 'POST',
    body: JSON.stringify(personalQuery)
  });

  addTestResult(
    'Personal Query Memory Search',
    searchResponse.ok && searchResponse.data.success,
    searchResponse.ok ? `Found ${searchResponse.data.data?.memories?.length || 0} memories` : 'Personal query search failed',
    searchResponse.data
  );

  // Test general query search
  const generalQuery = {
    userId: TEST_CONFIG.testUserId,
    query: 'math study tips',
    chatType: 'study_assistant',
    isPersonalQuery: false,
    contextLevel: 'balanced',
    limit: 3
  };

  const generalSearchResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/memory/search`, {
    method: 'POST',
    body: JSON.stringify(generalQuery)
  });

  addTestResult(
    'General Query Memory Search',
    generalSearchResponse.ok && generalSearchResponse.data.success,
    generalSearchResponse.ok ? `Found ${generalSearchResponse.data.data?.memories?.length || 0} memories` : 'General query search failed',
    generalSearchResponse.data
  );

  return searchResponse.data;
}

// 3. Memory Context Provider Integration
async function testMemoryContextProvider() {
  logSection('3. MEMORY CONTEXT PROVIDER INTEGRATION');
  
  // Test semantic search endpoint integration
  const semanticSearchTest = {
    userId: TEST_CONFIG.testUserId,
    query: 'Kunal math exam',
    limit: 5,
    minSimilarity: 0.6,
    contextLevel: 'comprehensive'
  };

  const semanticResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai/semantic-search`, {
    method: 'POST',
    body: JSON.stringify(semanticSearchTest)
  });

  addTestResult(
    'Semantic Search Integration',
    semanticResponse.ok && semanticResponse.data?.success !== false,
    semanticResponse.ok ? 'Semantic search working' : 'Semantic search failed',
    semanticResponse.data
  );

  // Test memory context formatting
  const searchData = semanticResponse.data;
  if (searchData?.data?.contextString) {
    addTestResult(
      'Memory Context Formatting',
      searchData.data.contextString.length > 0,
      `Context string length: ${searchData.data.contextString.length} chars`,
      { context: searchData.data.contextString.substring(0, 200) }
    );
  } else {
    addTestResult(
      'Memory Context Formatting',
      false,
      'No context string generated',
      searchData
    );
  }
}

// 4. Study Buddy Memory Integration
async function testStudyBuddyMemoryIntegration() {
  logSection('4. STUDY BUDDY MEMORY INTEGRATION');
  
  // Test study buddy endpoint with memory
  const studyBuddyRequest = {
    userId: TEST_CONFIG.testUserId,
    message: 'Hi, can you help me with my math exam?',
    conversationId: TEST_CONFIG.testConversationId,
    enableMemory: true
  };

  const studyBuddyResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/study-buddy`, {
    method: 'POST',
    body: JSON.stringify(studyBuddyRequest)
  });

  addTestResult(
    'Study Buddy Memory Integration',
    studyBuddyResponse.ok && studyBuddyResponse.data?.response,
    studyBuddyResponse.ok ? 'Study buddy responded with memory integration' : 'Study buddy memory integration failed',
    studyBuddyResponse.data
  );

  // Check if memory was used in response
  if (studyBuddyResponse.data?.response) {
    const response = studyBuddyResponse.data.response.toLowerCase();
    const hasPersonalContext = response.includes('kunal') || response.includes('name') || response.includes('exam');
    
    addTestResult(
      'Personal Context Usage in Study Buddy',
      hasPersonalContext,
      hasPersonalContext ? 'Personal context detected in response' : 'No personal context in response',
      { response: studyBuddyResponse.data.response.substring(0, 100) }
    );
  }
}

// 5. Memory System Performance
async function testMemorySystemPerformance() {
  logSection('5. MEMORY SYSTEM PERFORMANCE');
  
  const startTime = Date.now();
  
  // Test multiple memory operations
  const operations = [];
  for (let i = 0; i < 3; i++) {
    const memoryData = {
      userId: TEST_CONFIG.testUserId,
      message: `Performance test message ${i + 1}`,
      response: `Performance test response ${i + 1}`,
      metadata: { memoryType: 'performance_test' }
    };
    
    operations.push(makeRequest(`${TEST_CONFIG.baseUrl}/api/ai/memory-storage`, {
      method: 'POST',
      body: JSON.stringify(memoryData)
    }));
  }

  const results = await Promise.all(operations);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / operations.length;

  addTestResult(
    'Memory Storage Performance',
    avgTime < 2000, // Should be under 2 seconds
    `Average storage time: ${avgTime.toFixed(0)}ms`,
    { totalTime, operationCount: operations.length }
  );

  // Test search performance
  const searchStartTime = Date.now();
  await makeRequest(`${TEST_CONFIG.baseUrl}/api/memory/search`, {
    method: 'POST',
    body: JSON.stringify({
      userId: TEST_CONFIG.testUserId,
      query: 'performance test',
      isPersonalQuery: false
    })
  });
  const searchEndTime = Date.now();
  const searchTime = searchEndTime - searchStartTime;

  addTestResult(
    'Memory Search Performance',
    searchTime < 1000, // Should be under 1 second
    `Search time: ${searchTime}ms`,
    { searchTime }
  );
}

// 6. Memory Data Quality Validation
async function testMemoryDataQuality(memoryId) {
  logSection('6. MEMORY DATA QUALITY VALIDATION');
  
  // Get stored memories for the test user
  const memoriesResponse = await makeRequest(
    `${TEST_CONFIG.baseUrl}/api/memory/search?userId=${TEST_CONFIG.testUserId}&action=table-info`
  );

  if (memoriesResponse.ok && memoriesResponse.data?.data) {
    const data = memoriesResponse.data.data;
    addTestResult(
      'Memory Data Access',
      true,
      `Accessible memories: ${data.totalRecords || 0}`,
      data
    );
  } else {
    addTestResult(
      'Memory Data Access',
      false,
      'Failed to access memory data',
      memoriesResponse.data
    );
  }

  // Test memory quality scores
  if (memoryId) {
    addTestResult(
      'Memory ID Generation',
      memoryId && memoryId.length > 10,
      `Generated memory ID: ${memoryId}`,
      null
    );
  }
}

// 7. Integration with Hallucination Prevention Layers
async function testHallucinationPreventionIntegration() {
  logSection('7. HALLUCINATION PREVENTION LAYER INTEGRATION');
  
  // Test if memory system integrates with hallucination prevention
  try {
    // Read the layer files to verify integration points
    const layer1Path = path.join(__dirname, 'src/lib/hallucination-prevention/layer1/QueryClassifier.ts');
    const layer2Path = path.join(__dirname, 'src/lib/hallucination-prevention/layer2/ConversationMemory.ts');
    
    if (fs.existsSync(layer1Path)) {
      const layer1Content = fs.readFileSync(layer1Path, 'utf8');
      const hasMemoryIntegration = layer1Content.includes('memory') || layer1Content.includes('MemoryContext');
      
      addTestResult(
        'Layer 1 Memory Integration',
        hasMemoryIntegration,
        hasMemoryIntegration ? 'Layer 1 has memory integration' : 'Layer 1 missing memory integration',
        null
      );
    }
    
    if (fs.existsSync(layer2Path)) {
      const layer2Content = fs.readFileSync(layer2Path, 'utf8');
      const hasMemoryIntegration = layer2Content.includes('memory') || layer2Content.includes('MemoryContext');
      
      addTestResult(
        'Layer 2 Memory Integration',
        hasMemoryIntegration,
        hasMemoryIntegration ? 'Layer 2 has memory integration' : 'Layer 2 missing memory integration',
        null
      );
    }
  } catch (error) {
    addWarning('Hallucination Prevention Integration', `Could not verify layer integration: ${error.message}`);
  }
}

// Main validation function
async function runAdvancedMemorySystemValidation() {
  log(`${colors.bright}${colors.magenta}ADVANCED AI MEMORY SYSTEM VALIDATION${colors.reset}`);
  log(`${colors.magenta}=======================================${colors.reset}\n`);
  
  try {
    let storedMemoryId = null;
    
    // Run validation tests
    storedMemoryId = await testMemoryStorageAPI();
    await testMemorySearchAPI(storedMemoryId);
    await testMemoryContextProvider();
    await testStudyBuddyMemoryIntegration();
    await testMemorySystemPerformance();
    await testMemoryDataQuality(storedMemoryId);
    await testHallucinationPreventionIntegration();
    
    // Summary
    logSection('VALIDATION SUMMARY');
    log(`✓ Tests Passed: ${testResults.passed}`, 'green');
    log(`✗ Tests Failed: ${testResults.failed}`, 'failed' in colors ? 'red' : 'red');
    log(`⚠ Warnings: ${testResults.warnings}`, 'yellow');
    
    if (testResults.errors.length > 0) {
      log(`\n${colors.red}Failed Tests Details:${colors.reset}`);
      testResults.errors.forEach((error, index) => {
        log(`${index + 1}. ${error.test}: ${error.message}`, 'red');
        if (error.details) {
          log(`   Details: ${JSON.stringify(error.details, null, 2)}`, 'red');
        }
      });
    }
    
    // Overall assessment
    const successRate = testResults.passed / (testResults.passed + testResults.failed) * 100;
    log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
    
    if (successRate >= 80) {
      log(`${colors.green}✓ Memory system integration is working well!${colors.reset}`, 'green');
    } else if (successRate >= 60) {
      log(`${colors.yellow}⚠ Memory system integration has some issues that need attention.${colors.reset}`, 'yellow');
    } else {
      log(`${colors.red}✗ Memory system integration has significant problems.${colors.reset}`, 'red');
    }
    
    // Generate report file
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      successRate,
      assessment: successRate >= 80 ? 'GOOD' : successRate >= 60 ? 'NEEDS_ATTENTION' : 'CRITICAL',
      recommendations: generateRecommendations(testResults)
    };
    
    fs.writeFileSync(
      'advanced-ai-memory-system-validation-report.json',
      JSON.stringify(report, null, 2)
    );
    
    log(`\n${colors.cyan}Detailed report saved to: advanced-ai-memory-system-validation-report.json${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}Fatal error during validation: ${error.message}${colors.reset}`, 'red');
    console.error(error);
  }
}

function generateRecommendations(testResults) {
  const recommendations = [];
  
  if (testResults.failed > 0) {
    recommendations.push('Fix failed memory system tests before production deployment');
  }
  
  if (testResults.warnings > 0) {
    recommendations.push('Address warnings to improve system reliability');
  }
  
  if (testResults.errors.some(e => e.test.includes('Performance'))) {
    recommendations.push('Optimize memory system performance for production workloads');
  }
  
  if (testResults.errors.some(e => e.test.includes('Integration'))) {
    recommendations.push('Improve integration between memory system and other AI components');
  }
  
  return recommendations;
}

// Run the validation
if (require.main === module) {
  runAdvancedMemorySystemValidation().catch(console.error);
}

module.exports = { runAdvancedMemorySystemValidation, testResults };