#!/usr/bin/env node

/**
 * Test Fixed API Endpoints
 * =======================
 * Tests all the fixed endpoints with proper request formats
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '322531b3-173d-42a9-be4c-770ad92ac8b8';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      response: responseText
    };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Fixed API Endpoint Tests');
  console.log('=====================================');
  
  const results = [];
  
  // Test 1: Health Check
  const healthResult = await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/chat/health-check`,
    { method: 'GET' }
  );
  results.push(['Health Check', healthResult]);
  
  // Test 2: Study Assistant Send (with proper parameters)
  const studyAssistantResult = await testEndpoint(
    'Study Assistant Send',
    `${BASE_URL}/api/chat/study-assistant/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: 'Test thermodynamics explanation',
        context: { subject: 'Physics' }
      })
    }
  );
  results.push(['Study Assistant Send', studyAssistantResult]);
  
  // Test 3: Memory Storage
  const memoryStorageResult = await testEndpoint(
    'Memory Storage',
    `${BASE_URL}/api/ai/memory-storage`,
    {
      method: 'POST',
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: 'Test memory storage request',
        response: 'This is a test response for memory storage functionality'
      })
    }
  );
  results.push(['Memory Storage', memoryStorageResult]);
  
  // Test 4: Semantic Search
  const semanticSearchResult = await testEndpoint(
    'Semantic Search',
    `${BASE_URL}/api/ai/semantic-search`,
    {
      method: 'POST',
      body: JSON.stringify({
        userId: TEST_USER_ID,
        query: 'thermodynamics test',
        limit: 5
      })
    }
  );
  results.push(['Semantic Search', semanticSearchResult]);
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  let passed = 0;
  let total = results.length;
  
  results.forEach(([name, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    console.log(`${status} ${name} ${duration}`);
    
    if (result.success) {
      passed++;
    }
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${((passed/total) * 100).toFixed(1)}%)`);
  console.log(`Status: ${passed === total ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  return {
    total,
    passed,
    results
  };
}

// Run the tests
if (require.main === module) {
  runTests().then(summary => {
    process.exit(summary.passed === summary.total ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };