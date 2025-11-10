/**
 * Find Real User ID and Fix Memory
 * Check what user ID the actual Study Buddy is using
 */

console.log('🔍 FINDING REAL USER ID ISSUE');
console.log('=============================');

// Let's try a few common user ID patterns that might be used
const testUserIds = [
  "00000000-0000-0000-0000-000000000000", // Test user
  "kunal", // Simple string
  "test-user", // Another possibility
  "demo-user", // Demo user
  "user-123", // Dynamic user
];

async function testUserId(userId) {
  console.log(`\nTesting user ID: "${userId}"`);
  
  // First, try to search for any memories with this user ID
  const searchResult = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      query: "name personal introduction",
      limit: 5,
      minSimilarity: 0.1,
      searchType: "hybrid"
    })
  });
  
  const searchData = await searchResult.json();
  console.log(`  Memories found: ${searchData.memories?.length || 0}`);
  
  if (searchData.memories?.length === 0) {
    // No memories found for this user ID - let's store one
    console.log(`  No memories found. Storing fresh memory for user "${userId}"...`);
    
    const storeResult = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        message: "My name is Kunal",
        response: "Nice to meet you, Kunal!",
        metadata: {
          memoryType: 'ai_response',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_introduction',
          tags: ['name', 'introduction', 'personal'],
          context: {
            chatType: 'study_assistant',
            integrationVersion: '2.0'
          }
        }
      })
    });
    
    const storeData = await storeResult.json();
    console.log(`  Memory storage result: ${storeData.success ? 'SUCCESS' : 'FAILED'}`);
  }
  
  // Now test the "Do you know my name?" question
  const testResult = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "Do you know my name?",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      memoryOptions: {
        query: "Do you know my name?",
        minSimilarity: 0.1,
        searchType: 'hybrid'
      }
    })
  });
  
  const testData = await testResult.json();
  console.log(`  Test response: ${testData.data?.aiResponse?.query_type || 'N/A'}`);
  console.log(`  Response: ${testData.data?.aiResponse?.content?.substring(0, 100)}...`);
  
  return {
    userId,
    hasMemory: searchData.memories?.length > 0,
    correctResponse: testData.data?.aiResponse?.query_type === 'personal_query_with_memory',
    response: testData.data?.aiResponse?.content
  };
}

async function findCorrectUserId() {
  console.log('Testing multiple user ID patterns to find yours...\n');
  
  for (const userId of testUserIds) {
    const result = await testUserId(userId);
    
    if (result.correctResponse) {
      console.log(`\n🎉 FOUND THE CORRECT USER ID: "${userId}"`);
      console.log(`✅ This user ID now has working memory!`);
      console.log(`💡 You need to use this user ID in your Study Buddy session`);
      break;
    }
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('If none of the above worked, your user ID might be:');
  console.log('1. A UUID (like: 123e4567-e89b-12d3-a456-426614174000)');
  console.log('2. A random string from your auth system');
  console.log('3. Check your browser developer tools → Application → Local Storage → userId');
}

findCorrectUserId().catch(console.error);