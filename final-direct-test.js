/**
 * FINAL DIRECT TEST WITH ENHANCED LOGGING
 */

const userId = "322531b3-173d-42a9-be4c-770ad92ac8b8";

async function finalDirectTest() {
  console.log('🎯 FINAL DIRECT TEST WITH ENHANCED LOGGING');
  console.log('==========================================');
  
  // Test with direct API call that should work
  const response = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "Do you know my name?",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      includePersonalizedSuggestions: true,
      memoryOptions: {
        query: "Do you know my name? name Kunal",
        limit: 10,
        minSimilarity: 0.01,
        searchType: 'text'
      }
    })
  });
  
  const data = await response.json();
  console.log('📊 RESULT:');
  console.log('Query Type:', data.data?.aiResponse?.query_type);
  console.log('Memories Found:', data.data?.memoryContext?.memoriesFound);
  console.log('Response:', data.data?.aiResponse?.content);
  
  if (data.data?.memoryContext?.searchResults?.memories) {
    console.log('\n📚 MEMORY DETAILS:');
    data.data.memoryContext.searchResults.memories.forEach((mem, i) => {
      console.log(`  ${i+1}. "${mem.content}" (similarity: ${mem.similarity.toFixed(2)})`);
    });
  }
  
  // Also test the memory search directly
  console.log('\n🔍 TESTING MEMORY SEARCH DIRECTLY:');
  const searchResponse = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      query: "Kunal name",
      limit: 10,
      minSimilarity: 0.01,
      searchType: 'text'
    })
  });
  
  const searchData = await searchResponse.json();
  console.log('Direct search found:', searchData.memories?.length || 0, 'memories');
  if (searchData.memories?.length > 0) {
    searchData.memories.forEach((mem, i) => {
      console.log(`  Memory ${i+1}: "${mem.content}" (similarity: ${mem.similarity.toFixed(2)})`);
    });
  }
}

finalDirectTest().catch(console.error);