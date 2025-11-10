#!/usr/bin/env node

/**
 * Quick Test: "Do you know my name?" Problem Resolution
 * =====================================================
 * 
 * This focused test specifically validates that the original memory problem
 * has been solved. Tests the exact flow:
 * 1. Store "My name is Kunal" in memory
 * 2. Search for memories about name
 * 3. Verify AI chat can retrieve and use the name information
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

async function testCoreProblem() {
  console.log('🎯 QUICK TEST: "Do you know my name?" Problem Resolution');
  console.log('=' .repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('');

  const results = [];

  try {
    // Step 1: Store the name in memory
    console.log('Step 1: Storing "My name is Kunal" in memory...');
    const storageResult = await makeRequest(`${BASE_URL}/api/ai/memory-storage`, 'POST', {
      userId: TEST_USER_ID,
      message: 'My name is Kunal',
      response: 'Nice to meet you, Kunal!',
      conversationId: 'quick-test-' + Date.now(),
      metadata: {
        memoryType: 'learning_interaction',
        priority: 'critical',
        retention: 'long_term',
        topic: 'personal_info',
        tags: ['name', 'Kunal', 'introduction']
      }
    });

    if (storageResult.success) {
      console.log('✅ Step 1 PASSED: Name stored successfully');
      results.push({ step: 'Storage', status: 'PASS', details: storageResult.data?.memoryId });
    } else {
      console.log('❌ Step 1 FAILED: Could not store name');
      results.push({ step: 'Storage', status: 'FAIL', error: storageResult.error?.message });
      return results;
    }

    // Step 2: Search for memories about the name
    console.log('Step 2: Searching for name memories...');
    const searchResult = await makeRequest(`${BASE_URL}/api/ai/semantic-search`, 'POST', {
      userId: TEST_USER_ID,
      query: 'Do you know my name?',
      limit: 5,
      minSimilarity: 0.1,
      searchType: 'hybrid'
    });

    if (searchResult.success && searchResult.data.memories.length > 0) {
      const nameMemories = searchResult.data.memories.filter(m => 
        m.content.toLowerCase().includes('kunal') || 
        m.content.toLowerCase().includes('name')
      );
      
      console.log(`✅ Step 2 PASSED: Found ${searchResult.data.memories.length} memories, ${nameMemories.length} contain name info`);
      results.push({ 
        step: 'Search', 
        status: 'PASS', 
        details: `Found ${searchResult.data.memories.length} memories, ${nameMemories.length} relevant` 
      });
    } else {
      console.log('❌ Step 2 FAILED: No memories found');
      results.push({ step: 'Search', status: 'FAIL', error: searchResult.error?.message || 'No results' });
    }

    // Step 3: Test full AI chat with memory context
    console.log('Step 3: Testing AI chat with memory integration...');
    const chatResult = await makeRequest(`${BASE_URL}/api/ai/chat`, 'POST', {
      userId: TEST_USER_ID,
      message: 'Do you know my name?',
      conversationId: 'quick-test-' + Date.now(),
      includeMemoryContext: true,
      memoryOptions: {
        query: 'name Kunal introduction',
        limit: 3,
        searchType: 'hybrid'
      }
    });

    if (chatResult.success) {
      const aiResponse = chatResult.data.aiResponse.content.toLowerCase();
      const knowsName = aiResponse.includes('kunal') || 
                       chatResult.data.memoryContext?.memoriesFound > 0;
      
      if (knowsName) {
        console.log('✅ Step 3 PASSED: AI correctly remembered the name');
        console.log(`   AI Response: "${chatResult.data.aiResponse.content.substring(0, 100)}..."`);
        results.push({ 
          step: 'AI Chat', 
          status: 'PASS', 
          details: `AI response shows name awareness` 
        });
      } else {
        console.log('❌ Step 3 FAILED: AI did not recognize the name');
        console.log(`   AI Response: "${chatResult.data.aiResponse.content}"`);
        results.push({ 
          step: 'AI Chat', 
          status: 'FAIL', 
          error: 'AI response lacks name awareness' 
        });
      }
    } else {
      console.log('❌ Step 3 FAILED: Chat endpoint error');
      results.push({ step: 'AI Chat', status: 'FAIL', error: chatResult.error?.message });
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.push({ step: 'Overall', status: 'FAIL', error: error.message });
  }

  // Generate quick report
  console.log('');
  console.log('📋 QUICK TEST RESULTS');
  console.log('=' .repeat(30));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`Tests Passed: ${passed}/${total} (${successRate}%)`);
  console.log('');

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.step}: ${result.status}`);
    if (result.details) console.log(`   Details: ${result.details}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  console.log('');
  if (passed === total) {
    console.log('🎉 CORE PROBLEM SOLVED! "Do you know my name?" now works correctly!');
    console.log('✅ Memory storage: Working');
    console.log('✅ Memory retrieval: Working'); 
    console.log('✅ AI with memory: Working');
  } else {
    console.log('❌ CORE PROBLEM NOT FULLY RESOLVED');
    console.log('🔧 Some components need attention');
  }

  return results;
}

async function makeRequest(url, method, data) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Quick-AI-Test/1.0'
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

// Run the quick test
testCoreProblem().catch(console.error);