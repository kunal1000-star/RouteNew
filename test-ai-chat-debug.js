/**
 * Test AI Chat with detailed server-side debugging
 */

const testPayload = {
  userId: "00000000-0000-0000-0000-000000000000",
  message: "Do you know my name?",
  chatType: "study_assistant",
  includeMemoryContext: true,
  memoryOptions: {
    query: "name personal introduction",
    limit: 5,
    minSimilarity: 0.1,
    searchType: "hybrid"
  }
};

console.log('🔍 Testing AI Chat with Memory Options');
console.log('=======================================');
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('');

fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log('📋 AI Chat Response:');
  console.log('=====================');
  console.log('Success:', data.success);
  console.log('Query Type:', data.data?.aiResponse?.query_type);
  console.log('Memories Found:', data.data?.memoryContext?.memoriesFound);
  console.log('Memory Search Stats:', data.data?.memoryContext?.searchResults?.stats);
  
  if (data.data?.memoryContext?.memoriesFound > 0) {
    console.log('');
    console.log('🎉 SUCCESS! Memories found:');
    data.data.memoryContext.searchResults.memories.forEach((memory, i) => {
      console.log(`  ${i+1}. "${memory.content}" (similarity: ${memory.similarity.toFixed(2)})`);
    });
  } else {
    console.log('');
    console.log('❌ No memories found');
    console.log('Memory Search Stats:', JSON.stringify(data.data?.memoryContext?.searchResults?.stats, null, 2));
  }
  
  console.log('');
  console.log('💬 AI Response:');
  console.log(data.data?.aiResponse?.content || 'N/A');
  
  process.exit(0);
})
.catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});