/**
 * Test Memory Search API Directly
 * Check if the memory search API is working for the test user
 */

const testPayload = {
  userId: "00000000-0000-0000-0000-000000000000",
  query: "name personal introduction",
  limit: 5,
  minSimilarity: 0.1,
  searchType: "hybrid",
  contextLevel: "balanced"
};

console.log('🔍 Testing Memory Search API Directly');
console.log('=====================================');
console.log('Test UserId:', testPayload.userId);
console.log('Test Query:', testPayload.query);
console.log('');

fetch('http://localhost:3000/api/ai/semantic-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Memory Search API Result:');
  console.log('==============================');
  console.log('Success:', data.success || false);
  
  if (data.memories && data.memories.length > 0) {
    console.log(`Found ${data.memories.length} memories:`);
    data.memories.forEach((memory, i) => {
      console.log(`  ${i+1}. "${memory.content}" (similarity: ${memory.similarity.toFixed(2)})`);
    });
  } else {
    console.log('❌ No memories found');
  }
  
  if (data.searchStats) {
    console.log('');
    console.log('Search Stats:', JSON.stringify(data.searchStats, null, 2));
  }
  
  console.log('');
  console.log('🔧 Analysis:');
  if (data.memories && data.memories.length > 0) {
    console.log('✅ Memory search API is working');
    console.log('❌ The issue is in the AI chat\'s memory integration');
  } else {
    console.log('❌ Memory search API is not finding memories');
    console.log('💡 This suggests the stored memory is not being found');
  }
  
  process.exit(0);
})
.catch(error => {
  console.error('❌ Memory search API failed:', error);
  process.exit(1);
});