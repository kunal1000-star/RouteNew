// Direct test of memory storage and search with proper UUID
console.log("🔍 Direct Memory API Test - Isolation Test");
console.log("=" .repeat(50));

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

async function testMemoryStorageDirectly() {
  console.log("\n1️⃣ Testing Memory Storage API Directly");
  try {
    const response = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: 'My name is Kunal',
        response: 'Nice to meet you, Kunal!',
        metadata: {
          memoryType: 'ai_response',
          priority: 'medium',
          retention: 'long_term',
          topic: 'personal_introduction',
          tags: ['name', 'introduction', 'personal']
        }
      })
    });
    
    const result = await response.json();
    console.log("Storage Result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log("Storage Error:", error.message);
    return { error: error.message };
  }
}

async function testMemorySearchDirectly() {
  console.log("\n2️⃣ Testing Memory Search API Directly");
  try {
    const response = await fetch('http://localhost:3000/api/ai/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        query: 'My name is Kunal',
        limit: 5,
        minSimilarity: 0.1, // Very low threshold to catch anything
        searchType: 'text' // Use text search only
      })
    });
    
    const result = await response.json();
    console.log("Search Result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log("Search Error:", error.message);
    return { error: error.message };
  }
}

async function testAIChatWithDebug() {
  console.log("\n3️⃣ Testing AI Chat with Memory Debug");
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: 'Do you know my name?',
        chatType: 'study_assistant',
        includeMemoryContext: true,
        memoryOptions: {
          query: 'name personal information Kunal',
          limit: 3,
          minSimilarity: 0.1,
          searchType: 'text'
        }
      })
    });
    
    const result = await response.json();
    console.log("AI Chat Result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log("AI Chat Error:", error.message);
    return { error: error.message };
  }
}

async function runDirectMemoryTest() {
  // Step 1: Store a memory
  const storageResult = await testMemoryStorageDirectly();
  
  // Wait for storage to complete
  console.log("\n⏳ Waiting 3 seconds for storage to complete...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 2: Search for the stored memory
  const searchResult = await testMemorySearchDirectly();
  
  // Wait
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Test AI chat integration
  const aiChatResult = await testAIChatWithDebug();
  
  console.log("\n" + "=" .repeat(50));
  console.log("📊 FINAL ANALYSIS:");
  
  const storageSuccess = storageResult.success;
  const searchMemories = searchResult.memories || searchResult.memoriesFound || 0;
  const aiMemories = aiChatResult.data?.memoryContext?.memoriesFound || 0;
  
  console.log(`Memory Storage: ${storageSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`Memory Search: ${searchMemories > 0 ? `✅ Found ${searchMemories} memories` : '❌ No memories found'}`);
  console.log(`AI Chat Integration: ${aiMemories > 0 ? `✅ Using ${aiMemories} memories` : '❌ No memory context'}`);
  
  if (!storageSuccess) {
    console.log("\n🔧 ISSUE: Memory storage is failing");
    console.log("Root cause: Check storage API error above");
  } else if (searchMemories === 0) {
    console.log("\n🔧 ISSUE: Memory storage works but search fails");
    console.log("Root cause: Search API not finding stored memories");
  } else if (aiMemories === 0) {
    console.log("\n🔧 ISSUE: Memory search works but AI chat doesn't use it");
    console.log("Root cause: AI chat not calling or using memory search results");
  } else {
    console.log("\n🎉 SUCCESS: All memory systems working!");
    console.log("Kunal memory problem should be FIXED!");
  }
}

runDirectMemoryTest().catch(console.error);