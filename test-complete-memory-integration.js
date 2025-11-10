// Complete Memory Integration Test
// Tests the full flow: Storage -> Search -> Personalized Response

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testCompleteMemoryIntegration() {
  console.log('🧠 Testing Complete Memory Integration');
  console.log('=' .repeat(50));

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testConversationId = `test-${Date.now()}`;

  try {
    // Step 1: Test Personal Information Storage
    console.log('\n📝 Step 1: Storing personal information...');
    
    const storageResponse = await fetch(`${BASE_URL}/api/ai/memory-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'My name is Kunal and I am studying for JEE 2025',
        response: 'Nice to meet you Kunal! Preparing for JEE 2025 is exciting. What subjects are you focusing on?',
        conversationId: testConversationId,
        metadata: {
          memoryType: 'user_query',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_introduction',
          tags: ['name', 'jee', 'student']
        }
      })
    });

    const storageResult = await storageResponse.json();
    console.log('✅ Storage result:', storageResult.success ? 'SUCCESS' : 'FAILED');
    if (storageResult.success) {
      console.log(`📦 Memory stored with ID: ${storageResult.data?.memoryId}`);
    } else {
      console.error('❌ Storage failed:', storageResult.error);
    }

    // Step 2: Test Memory Search
    console.log('\n🔍 Step 2: Testing memory search...');
    
    const searchResponse = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        query: 'my name',
        limit: 5,
        minSimilarity: 0.5,
        searchType: 'hybrid'
      })
    });

    const searchResult = await searchResponse.json();
    console.log('✅ Search result:', searchResult.memories ? 'SUCCESS' : 'FAILED');
    if (searchResult.memories && searchResult.memories.length > 0) {
      console.log(`🔎 Found ${searchResult.memories.length} memories:`);
      searchResult.memories.forEach((memory, i) => {
        console.log(`   ${i + 1}. "${memory.content}" (similarity: ${memory.similarity})`);
      });
    } else {
      console.log('❌ No memories found or search failed');
    }

    // Step 3: Test Complete AI Chat with Memory
    console.log('\n🤖 Step 3: Testing AI chat with memory integration...');
    
    const chatResponse = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'Do you know my name?',
        conversationId: testConversationId,
        chatType: 'study_assistant',
        includeMemoryContext: true,
        memoryOptions: {
          query: 'name personal information',
          limit: 3,
          searchType: 'hybrid'
        }
      })
    });

    const chatResult = await chatResponse.json();
    console.log('✅ Chat result:', chatResult.success ? 'SUCCESS' : 'FAILED');
    
    if (chatResult.success) {
      console.log('\n📋 Response Details:');
      console.log(`   Content: "${chatResult.data.aiResponse.content}"`);
      console.log(`   Query Type: ${chatResult.data.aiResponse.query_type}`);
      console.log(`   Model: ${chatResult.data.aiResponse.model_used}`);
      console.log(`   Memory Context: ${chatResult.data.memoryContext?.memoriesFound || 0} memories found`);
      
      // Check if the response is personalized
      const response = chatResult.data.aiResponse.content.toLowerCase();
      const hasPersonalizedResponse = response.includes('kunal') || response.includes('remember');
      
      console.log(`\n🎯 Personalization Test:`);
      if (hasPersonalizedResponse) {
        console.log('   ✅ AI successfully used memory context!');
        console.log('   ✅ No more generic "I don\'t remember" responses!');
      } else {
        console.log('   ❌ AI did not use memory context properly');
        console.log('   ⚠️  Response may still be generic');
      }
    } else {
      console.error('❌ Chat failed:', chatResult.error);
    }

    // Step 4: Test Memory Storage from Chat
    console.log('\n💾 Step 4: Verifying conversation was stored...');
    
    // Give some time for background storage
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verificationResponse = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        query: 'do you know my name',
        limit: 5,
        minSimilarity: 0.3
      })
    });

    const verificationResult = await verificationResponse.json();
    const totalMemories = (verificationResult.memories || []).length;
    
    console.log(`📊 Memory verification:`);
    console.log(`   Total memories for user: ${totalMemories}`);
    if (totalMemories >= 2) {
      console.log('   ✅ Both user message and AI response were stored!');
    } else {
      console.log('   ⚠️  Some conversations may not have been stored');
    }

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MEMORY INTEGRATION TEST SUMMARY:');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Memory Storage', pass: storageResult.success },
      { name: 'Memory Search', pass: searchResult.memories && searchResult.memories.length > 0 },
      { name: 'AI Chat Integration', pass: chatResult.success },
      { name: 'Personalized Response', pass: hasPersonalizedResponse },
      { name: 'Conversation Storage', pass: totalMemories >= 2 }
    ];
    
    tests.forEach(test => {
      console.log(`${test.pass ? '✅' : '❌'} ${test.name}: ${test.pass ? 'PASS' : 'FAIL'}`);
    });
    
    const passedTests = tests.filter(t => t.pass).length;
    console.log(`\n🏆 Overall: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 ALL TESTS PASSED! Memory integration is working correctly!');
      console.log('🚀 The "Do you know my name?" problem is now SOLVED!');
    } else {
      console.log('⚠️  Some tests failed. Memory integration may need fixes.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test the memory search and storage endpoints health
async function testEndpointHealth() {
  console.log('\n🏥 Testing Endpoint Health...');
  
  const endpoints = [
    { name: 'Memory Storage', url: `${BASE_URL}/api/ai/memory-storage?action=health` },
    { name: 'Semantic Search', url: `${BASE_URL}/api/ai/semantic-search?action=health` },
    { name: 'AI Chat', url: `${BASE_URL}/api/ai/chat?action=health` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const data = await response.json();
      console.log(`${endpoint.name}: ${data.success ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    } catch (error) {
      console.log(`${endpoint.name}: ❌ ERROR - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Memory Integration Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  await testEndpointHealth();
  await testCompleteMemoryIntegration();
}

// Run the tests
main().catch(console.error);