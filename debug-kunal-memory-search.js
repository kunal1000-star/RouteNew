/**
 * DEBUG MEMORY SEARCH FOR KUNAL'S USER ID
 */

const userId = "322531b3-173d-42a9-be4c-770ad92ac8b8";

async function debugMemorySearch() {
  console.log(`🔍 DEBUGGING MEMORY SEARCH FOR KUNAL`);
  console.log(`User ID: ${userId}`);
  console.log('=====================================');
  
  // Step 1: Direct memory search test
  console.log('1. Testing direct memory search...');
  const searchResponse = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      query: "name personal introduction",
      limit: 10,
      minSimilarity: 0.05, // Very low threshold
      searchType: "hybrid"
    })
  });
  
  const searchData = await searchResponse.json();
  console.log(`Search Results: ${searchData.memories?.length || 0} memories found`);
  
  if (searchData.memories?.length > 0) {
    searchData.memories.forEach((mem, i) => {
      console.log(`  Memory ${i+1}: "${mem.content}" (similarity: ${mem.similarity})`);
    });
  } else {
    console.log('  ❌ No memories found in direct search');
    console.log('  Search stats:', searchData.searchStats);
  }
  
  // Step 2: Test with even more specific query
  console.log('\n2. Testing with more specific query...');
  const specificResponse = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      query: "Kunal name is Kunal my name",
      limit: 10,
      minSimilarity: 0.01, // Extremely low threshold
      searchType: "text" // Try text search instead of hybrid
    })
  });
  
  const specificData = await specificResponse.json();
  console.log(`Specific Search Results: ${specificData.memories?.length || 0} memories found`);
  
  if (specificData.memories?.length > 0) {
    specificData.memories.forEach((mem, i) => {
      console.log(`  Memory ${i+1}: "${mem.content}" (similarity: ${mem.similarity})`);
    });
  } else {
    console.log('  ❌ No memories found in specific search either');
    console.log('  Search stats:', specificData.searchStats);
  }
  
  // Step 3: Check if memory was actually stored in the correct table
  console.log('\n3. Checking memory storage status...');
  
  // Let's try storing a memory with even more explicit content
  console.log('4. Trying to store a very explicit memory...');
  const explicitResponse = await fetch('http://localhost:3000/api/ai/memory-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "HELLO MY NAME IS KUNAL",
      response: "I understand your name is Kunal!",
      metadata: {
        memoryType: 'ai_response',
        priority: 'high',
        retention: 'long_term',
        topic: 'name_introduction',
        tags: ['name', 'kunal', 'introduction'],
        context: {
          chatType: 'study_assistant',
          integrationVersion: '2.0'
        }
      }
    })
  });
  
  const explicitData = await explicitResponse.json();
  console.log(`Explicit memory storage: ${explicitData.success ? 'SUCCESS' : 'FAILED'}`);
  if (explicitData.success) {
    console.log(`Memory ID: ${explicitData.data?.memoryId}`);
  } else {
    console.log(`Error: ${explicitData.error?.message}`);
  }
  
  // Step 4: Test AI chat with the explicit memory
  console.log('\n5. Testing AI chat with explicit memory...');
  const aiResponse = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "What is my name?",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      memoryOptions: {
        query: "name Kunal",
        minSimilarity: 0.01,
        searchType: 'text',
        limit: 10
      }
    })
  });
  
  const aiData = await aiResponse.json();
  console.log(`AI Query Type: ${aiData.data?.aiResponse?.query_type}`);
  console.log(`AI Response: ${aiData.data?.aiResponse?.content}`);
  console.log(`Memories Found: ${aiData.data?.memoryContext?.memoriesFound}`);
  
  if (aiData.data?.memoryContext?.memoriesFound > 0) {
    console.log('🎉 Memory found! Details:');
    aiData.data.memoryContext.searchResults.memories.forEach((mem, i) => {
      console.log(`  ${i+1}. "${mem.content}" (similarity: ${mem.similarity})`);
    });
  }
}

debugMemorySearch().catch(console.error);