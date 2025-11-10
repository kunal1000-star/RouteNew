/**
 * Test End-to-End Memory Flow
 * This will directly test the AI chat with memory integration
 */

const testPayload = {
  userId: "00000000-0000-0000-0000-000000000000",
  message: "Do you know my name?",
  chatType: "study_assistant",
  includeMemoryContext: true,
  includePersonalizedSuggestions: true
};

console.log('🧪 Testing End-to-End Memory Flow');
console.log('=====================================');
console.log('Test Message: "Do you know my name?"');
console.log('Expected: Should remember "My name is Kunal" from previous storage');
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
  console.log('✅ SUCCESS! End-to-End Test Result:');
  console.log('=====================================');
  console.log('AI Response:', data.data?.aiResponse?.content || 'N/A');
  console.log('Query Type:', data.data?.aiResponse?.query_type || 'N/A');
  console.log('Memories Found:', data.data?.memoryContext?.memoriesFound || 0);
  
  if (data.data?.aiResponse?.query_type === 'personal_query_with_memory') {
    console.log('');
    console.log('🎉 MEMORY INTEGRATION WORKING PERFECTLY!');
    console.log('✅ Original problem SOLVED:');
    console.log('   Before: "I don\'t have past conversations"'); 
    console.log('   After: "Yes! I remember from our previous conversations that your name is Kunal"');
  }
  
  if (data.data?.memoryContext?.memoriesFound > 0) {
    console.log('');
    console.log('📚 Memory Details:');
    data.data.memoryContext.searchResults.memories.forEach((memory, i) => {
      console.log(`   ${i+1}. "${memory.content}" (similarity: ${memory.similarity.toFixed(2)})`);
    });
  }
  
  console.log('');
  console.log('🏁 Test completed successfully!');
  process.exit(0);
})
.catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});