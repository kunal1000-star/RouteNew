/**
 * EXACT PARAMETER MATCHING TEST
 * Using the exact same parameters that work in direct search
 */

const userId = "322531b3-173d-42a9-be4c-770ad92ac8b8";

async function exactParameterTest() {
  console.log('🎯 EXACT PARAMETER MATCHING TEST');
  console.log('================================');
  
  // Test with EXACT same parameters that work in direct search
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
        query: "Kunal name",  // EXACT query that works
        limit: 10,            // EXACT limit that works
        minSimilarity: 0.01,  // EXACT similarity that works
        searchType: 'text'    // EXACT search type that works
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
  
  // Now test with the same search structure but using the searchMemories function directly
  console.log('\n🔍 TESTING searchMemories FUNCTION DIRECTLY:');
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
  console.log('Direct API found:', searchData.memories?.length || 0, 'memories');
  if (searchData.memories?.length > 0) {
    console.log('First memory:', searchData.memories[0].content);
    console.log('First memory similarity:', searchData.memories[0].similarity.toFixed(2));
  }
}

exactParameterTest().catch(console.error);