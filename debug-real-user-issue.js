/**
 * Debug Real User Session Issue
 * Check what's happening with the actual user data
 */

console.log('🔍 INVESTIGATING REAL USER SESSION ISSUE');
console.log('========================================');

// First, let's check what memories exist in the database
const checkMemories = async () => {
  console.log('1. Checking existing memories in database...');
  const memoryCheck = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      query: "name personal introduction",
      limit: 10,
      minSimilarity: 0.1,
      searchType: "hybrid"
    })
  });
  
  const memoryData = await memoryCheck.json();
  console.log('Memories found:', memoryData.memories?.length || 0);
  if (memoryData.memories?.length > 0) {
    memoryData.memories.forEach((mem, i) => {
      console.log(`  Memory ${i+1}: "${mem.content}" (User: ${mem.user_id || 'N/A'})`);
    });
  }
};

// Test the exact API call Study Buddy makes
const testStudyBuddyCall = async () => {
  console.log('\n2. Testing exact Study Buddy API call...');
  const testCall = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      message: "Do you know my name?",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      includePersonalizedSuggestions: true,
      memoryOptions: {
        query: "Do you know my name?",
        limit: 5,
        minSimilarity: 0.1,
        searchType: 'hybrid',
        contextLevel: 'balanced'
      }
    })
  });
  
  const response = await testCall.json();
  console.log('API Response:');
  console.log('  Success:', response.success);
  console.log('  Query Type:', response.data?.aiResponse?.query_type);
  console.log('  Memories Found:', response.data?.memoryContext?.memoriesFound);
  console.log('  Response:', response.data?.aiResponse?.content);
  
  if (response.data?.memoryContext?.searchResults?.stats?.error) {
    console.log('  Memory Search Error:', response.data.memoryContext.searchResults.stats.error);
  }
};

// Store a fresh memory for the user
const storeFreshMemory = async () => {
  console.log('\n3. Storing fresh memory for user...');
  const storeCall = await fetch('http://localhost:3000/api/ai/memory-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
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
  
  const storeData = await storeCall.json();
  console.log('Memory Storage Result:');
  console.log('  Success:', storeData.success);
  console.log('  Memory ID:', storeData.data?.memoryId);
  if (storeData.error) {
    console.log('  Error:', storeData.error);
  }
};

// Test the complete flow
const runDiagnostics = async () => {
  await checkMemories();
  await testStudyBuddyCall();
  await storeFreshMemory();
  await testStudyBuddyCall();
};

runDiagnostics().catch(console.error);