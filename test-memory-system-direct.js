// Direct memory system test
console.log("🔍 Testing Memory System Components");

// Test 1: Memory Storage
async function testMemoryStorage() {
  console.log("\n📝 Test 1: Memory Storage");
  try {
    const response = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'kunal-test-user-123',
        message: 'My name is Kunal',
        response: 'Nice to meet you, Kunal!',
        metadata: {
          memoryType: 'ai_response',
          priority: 'medium',
          retention: 'long_term',
          topic: 'study_assistant_conversation',
          tags: ['conversation', 'study_buddy'],
          context: {
            chatType: 'study_assistant',
            integrationVersion: '2.0'
          }
        }
      })
    });
    
    const result = await response.json();
    console.log(`Storage Response:`, result);
    return result;
  } catch (error) {
    console.log(`Storage Error:`, error.message);
    return { error: error.message };
  }
}

// Test 2: Memory Search
async function testMemorySearch() {
  console.log("\n🔍 Test 2: Memory Search");
  try {
    const response = await fetch('http://localhost:3000/api/ai/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'kunal-test-user-123',
        query: 'name Kunal',
        limit: 5,
        minSimilarity: 0.6,
        searchType: 'hybrid',
        contextLevel: 'balanced'
      })
    });
    
    console.log(`Search Response Status: ${response.status}`);
    const text = await response.text();
    console.log(`Search Response Text:`, text.substring(0, 500));
    
    try {
      const result = JSON.parse(text);
      console.log(`Search Result:`, result);
      return result;
    } catch (jsonError) {
      console.log(`JSON Parse Error:`, jsonError.message);
      return { parseError: jsonError.message, rawResponse: text };
    }
  } catch (error) {
    console.log(`Search Error:`, error.message);
    return { error: error.message };
  }
}

// Test 3: AI Chat with Memory
async function testAIChatWithMemory() {
  console.log("\n🤖 Test 3: AI Chat with Memory Context");
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'kunal-test-user-123',
        message: 'Do you know my name?',
        chatType: 'study_assistant',
        includeMemoryContext: true,
        memoryOptions: {
          query: 'name personal information',
          limit: 3,
          searchType: 'hybrid'
        }
      })
    });
    
    const result = await response.json();
    console.log(`AI Chat Result:`, result);
    return result;
  } catch (error) {
    console.log(`AI Chat Error:`, error.message);
    return { error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log("=" .repeat(50));
  console.log("🧪 MEMORY SYSTEM DIAGNOSTIC TEST");
  console.log("=" .repeat(50));
  
  // Step 1: Test storage
  const storageResult = await testMemoryStorage();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Test search
  const searchResult = await testMemorySearch();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Test AI chat integration
  const aiChatResult = await testAIChatWithMemory();
  
  console.log("\n" + "=" .repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=" .repeat(50));
  console.log("Memory Storage:", storageResult.success ? "✅ Working" : "❌ Failed");
  console.log("Memory Search:", searchResult.success ? "✅ Working" : "❌ Failed");  
  console.log("AI Chat Integration:", aiChatResult.success ? "✅ Working" : "❌ Failed");
  
  if (storageResult.error || searchResult.error || aiChatResult.error) {
    console.log("\n🔍 ISSUES DETECTED - Check server logs for details");
  } else {
    console.log("\n🎉 All components working - check memory flow");
  }
}

runAllTests().catch(console.error);