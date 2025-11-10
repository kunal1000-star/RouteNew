// Simple Memory Integration Test - Direct endpoint testing
// Tests the full flow: Storage -> Search -> Personalized Response

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testEndpoint(url, options = {}) {
  try {
    console.log(`🔍 Testing: ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    if (data.success !== undefined) {
      console.log(`   Success: ${data.success ? '✅' : '❌'}`);
    }
    return { response, data, ok: response.ok };
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
    return { ok: false, error: error.message };
  }
}

async function testCompleteMemoryIntegration() {
  console.log('🧠 Testing Complete Memory Integration');
  console.log('=' .repeat(50));
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testConversationId = `test-${Date.now()}`;

  try {
    // Step 1: Test Health Endpoints
    console.log('🏥 Step 1: Testing endpoint health...');
    const healthTests = [
      testEndpoint(`${BASE_URL}/api/ai/memory-storage?action=health`),
      testEndpoint(`${BASE_URL}/api/ai/semantic-search?action=health`),
      testEndpoint(`${BASE_URL}/api/ai/chat?action=health`)
    ];
    
    const healthResults = await Promise.all(healthTests);
    const allHealthy = healthResults.every(r => r.ok);
    console.log(`   Overall Health: ${allHealthy ? '✅ ALL HEALTHY' : '⚠️ SOME ISSUES'}\n`);

    // Step 2: Test Personal Information Storage
    console.log('📝 Step 2: Storing personal information...');
    
    const storageResponse = await testEndpoint(`${BASE_URL}/api/ai/memory-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'My name is Kunal and I am studying for JEE 2025',
        response: 'Nice to meet you Kunal! Preparing for JEE 2025 is exciting.',
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

    console.log('   Result:', storageResponse.ok ? '✅ STORED' : '❌ FAILED');
    if (storageResponse.ok && storageResponse.data?.success) {
      console.log(`   Memory ID: ${storageResponse.data.data?.memoryId}`);
    }

    // Step 3: Test Memory Search
    console.log('\n🔍 Step 3: Testing memory search...');
    
    const searchResponse = await testEndpoint(`${BASE_URL}/api/ai/semantic-search`, {
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

    console.log('   Result:', searchResponse.ok ? '✅ SEARCHED' : '❌ FAILED');
    if (searchResponse.ok && searchResponse.data?.memories) {
      console.log(`   Found ${searchResponse.data.memories.length} memories`);
      searchResponse.data.memories.forEach((memory, i) => {
        console.log(`   ${i + 1}. "${memory.content?.substring(0, 50)}..." (similarity: ${memory.similarity})`);
      });
    }

    // Step 4: Test Complete AI Chat with Memory
    console.log('\n🤖 Step 4: Testing AI chat with memory integration...');
    
    const chatResponse = await testEndpoint(`${BASE_URL}/api/ai/chat`, {
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

    console.log('   Result:', chatResponse.ok ? '✅ CHAT COMPLETED' : '❌ FAILED');
    
    if (chatResponse.ok && chatResponse.data?.success) {
      const aiResponse = chatResponse.data.data?.aiResponse;
      const memoryContext = chatResponse.data.data?.memoryContext;
      
      console.log('\n   📋 Response Details:');
      console.log(`      Content: "${aiResponse?.content?.substring(0, 100)}..."`);
      console.log(`      Query Type: ${aiResponse?.query_type}`);
      console.log(`      Model: ${aiResponse?.model_used}`);
      console.log(`      Memory Context: ${memoryContext?.memoriesFound || 0} memories found`);
      
      // Check if the response is personalized
      const response = (aiResponse?.content || '').toLowerCase();
      const hasPersonalizedResponse = response.includes('kunal') || response.includes('remember');
      
      console.log('\n   🎯 Personalization Test:');
      if (hasPersonalizedResponse) {
        console.log('      ✅ AI successfully used memory context!');
        console.log('      ✅ No more generic "I don\'t remember" responses!');
      } else {
        console.log('      ❌ AI did not use memory context properly');
        console.log('      ⚠️  Response may still be generic');
      }
    }

    // Step 5: Test Follow-up Question
    console.log('\n💬 Step 5: Testing follow-up question...');
    
    const followUpResponse = await testEndpoint(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'What am I studying for?',
        conversationId: testConversationId,
        chatType: 'study_assistant',
        includeMemoryContext: true
      })
    });

    if (followUpResponse.ok && followUpResponse.data?.success) {
      const followUpContent = followUpResponse.data.data?.aiResponse?.content || '';
      const mentionsJEE = followUpContent.toLowerCase().includes('jee') || 
                         followUpContent.toLowerCase().includes('2025');
      
      console.log('   Response:', `"${followUpContent.substring(0, 100)}..."`);
      console.log('   Memory Usage:', mentionsJEE ? '✅ Used memory context' : '❌ No memory context used');
    }

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MEMORY INTEGRATION TEST SUMMARY:');
    console.log('=' .repeat(50));
    
    const tests = [
      { 
        name: 'Endpoint Health', 
        pass: allHealthy,
        details: `${healthResults.filter(r => r.ok).length}/${healthResults.length} endpoints healthy`
      },
      { 
        name: 'Memory Storage', 
        pass: storageResponse.ok && storageResponse.data?.success,
        details: storageResponse.data?.success ? 'Memory stored successfully' : 'Storage failed'
      },
      { 
        name: 'Memory Search', 
        pass: searchResponse.ok && searchResponse.data?.memories?.length > 0,
        details: `Found ${searchResponse.data?.memories?.length || 0} memories`
      },
      { 
        name: 'AI Chat Integration', 
        pass: chatResponse.ok && chatResponse.data?.success,
        details: chatResponse.data?.success ? 'Chat with memory worked' : 'Chat failed'
      },
      { 
        name: 'Personalized Response', 
        pass: chatResponse.ok && chatResponse.data?.success && hasPersonalizedResponse,
        details: hasPersonalizedResponse ? 'AI remembered personal info!' : 'Generic response still used'
      },
      { 
        name: 'Follow-up Memory', 
        pass: followUpResponse.ok && followUpResponse.data?.success && mentionsJEE,
        details: mentionsJEE ? 'Follow-up also used memory' : 'Follow-up lost context'
      }
    ];
    
    tests.forEach(test => {
      console.log(`${test.pass ? '✅' : '❌'} ${test.name}: ${test.pass ? 'PASS' : 'FAIL'}`);
      console.log(`   ${test.details}`);
    });
    
    const passedTests = tests.filter(t => t.pass).length;
    console.log(`\n🏆 Overall: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('\n🎉 ALL TESTS PASSED! Memory integration is working correctly!');
      console.log('🚀 The "Do you know my name?" problem is now SOLVED!');
      console.log('✅ Users will no longer get generic "I don\'t remember" responses');
      console.log('✅ Study Buddy now has true memory and personalization!');
    } else if (passedTests >= tests.length - 1) {
      console.log('\n🎯 MOSTLY WORKING! Memory integration is functional with minor issues');
    } else {
      console.log('\n⚠️  SIGNIFICANT ISSUES! Memory integration needs fixes');
      console.log('🔧 The "Do you know my name?" problem is NOT fully resolved');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
  }
}

// Main execution
main().catch(console.error);

async function main() {
  await testCompleteMemoryIntegration();
}