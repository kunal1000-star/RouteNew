/**
 * Manual Study Buddy Test Runner - Tests each scenario individually
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/ai/chat';

async function makeRequest(payload) {
  console.log(`Testing: ${payload.message || payload.test || 'No message'}`);
  
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response keys: ${Object.keys(data).join(', ')}`);
  
  if (data.aiResponse) {
    console.log(`Model: ${data.aiResponse.model_used || 'N/A'}`);
    console.log(`Provider: ${data.aiResponse.provider_used || 'N/A'}`);
    console.log(`Tokens: ${data.aiResponse.tokens_used || 'N/A'}`);
    console.log(`Query Type: ${data.aiResponse.query_type || 'N/A'}`);
    console.log(`Web Search: ${data.aiResponse.web_search_enabled || false}`);
  }
  
  if (data.integrationStatus) {
    console.log(`Personalization: ${data.integrationStatus.personalization_system || false}`);
    console.log(`Memory: ${data.integrationStatus.memory_system || false}`);
    console.log(`Hallucination Layers: ${data.integrationStatus.hallucination_prevention_layers?.join(', ') || 'N/A'}`);
  }
  
  console.log(`Response Preview: ${data.aiResponse?.content?.substring(0, 200)}...`);
  console.log('---');
  
  return data;
}

async function runTests() {
  console.log('🧪 MANUAL STUDY BUDDY TEST SUITE');
  console.log('=' * 50);
  
  // Test 1: Critical Thermodynamics Test
  console.log('\n🔬 Test 1: Critical Thermodynamics Test');
  await makeRequest({
    message: 'thermodynamics sajha do',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 2: Personalization Detection Test
  console.log('\n👤 Test 2: Personalization Detection Test');
  await makeRequest({
    message: 'my physics test is tomorrow',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  console.log('\n👤 Test 2b: General Query Test');
  await makeRequest({
    message: 'what is gravity?',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  console.log('\n👤 Test 2c: Context Setting Test');
  await makeRequest({
    message: "remember I'm studying for JEE",
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 3: Memory Integration Test
  console.log('\n🧠 Test 3: Memory Integration Test');
  await makeRequest({
    message: 'I am studying quantum mechanics',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 4: Web Search Decision Test
  console.log('\n🔍 Test 4: Web Search Decision Test');
  await makeRequest({
    message: 'latest research on quantum computing 2024',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  console.log('\n🔍 Test 4b: Internal Knowledge Test');
  await makeRequest({
    message: 'explain Newton\'s laws',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 5: Hallucination Prevention Test
  console.log('\n🛡️ Test 5: Hallucination Prevention Test');
  await makeRequest({
    message: 'What is the answer to everything?',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  console.log('\n🛡️ Test 5b: Complex Factual Test');
  await makeRequest({
    message: 'Explain quantum entanglement and its applications in computing',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 6: Real AI Integration Test
  console.log('\n🤖 Test 6: Real AI Integration Test');
  await makeRequest({
    message: 'What is the capital of France?',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 7: Error Handling Test
  console.log('\n⚠️ Test 7: Error Handling Test');
  try {
    await makeRequest({
      message: '',
      userId: 'test-user-12345'
    });
  } catch (error) {
    console.log(`Error handling test result: ${error.message}`);
  }
  
  console.log('\n✅ Manual test suite completed!');
}

// Run all tests
runTests().catch(console.error);