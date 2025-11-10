/**
 * Deep Debug - Track exactly what happens in searchMemories function
 */

const testPayload = {
  userId: "00000000-0000-0000-0000-000000000000",
  message: "Do you know my name?",
  chatType: "study_assistant",
  includeMemoryContext: true,
  includePersonalizedSuggestions: true
};

console.log('🔍 Deep Debug - Memory Search Call');
console.log('=====================================');

const searchOptions = {
  query: "name personal introduction", 
  limit: 5,
  minSimilarity: 0.1,
  searchType: "hybrid",
  contextLevel: "balanced"
};

const searchPayload = {
  userId: "00000000-0000-0000-0000-000000000000",
  query: searchOptions.query,
  limit: searchOptions.limit,
  minSimilarity: searchOptions.minSimilarity,
  searchType: searchOptions.searchType,
  contextLevel: searchOptions.contextLevel
};

console.log('📤 About to call searchMemories with payload:');
console.log(JSON.stringify(searchPayload, null, 2));

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
console.log('🌐 Using base URL:', baseUrl);

fetch(`${baseUrl}/api/ai/semantic-search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(searchPayload)
})
.then(response => {
  console.log('📥 Raw response status:', response.status);
  console.log('📥 Raw response headers:', Object.fromEntries(response.headers.entries()));
  return response;
})
.then(response => response.json())
.then(data => {
  console.log('📋 Full response data:');
  console.log(JSON.stringify(data, null, 2));
  
  console.log('');
  console.log('🔍 Analyzing response structure:');
  console.log('Has data.memories:', !!data.data?.memories);
  console.log('Has memories (root):', !!data.memories);
  console.log('Has data:', !!data.data);
  console.log('Response keys:', Object.keys(data));
  
  if (data.data?.memories) {
    console.log('✅ Found memories in data.memories');
    console.log('Memories count:', data.data.memories.length);
  } else if (data.memories) {
    console.log('✅ Found memories at root level');
    console.log('Memories count:', data.memories.length);
  } else {
    console.log('❌ No memories found in response');
  }
  
  process.exit(0);
})
.catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});