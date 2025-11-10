// AI Semantic Search Endpoint Test
// ================================

// Test the semantic search endpoint
const testSemanticSearch = async () => {
  try {
    // Test 1: Health check
    console.log('Testing semantic search health check...');
    const healthResponse = await fetch('http://localhost:3000/api/ai/semantic-search?action=health');
    const healthData = await healthResponse.json();
    console.log('Health check result:', healthData);

    // Test 2: Store a test memory first
    console.log('\nStoring test memory...');
    const storageResponse = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'My name is Kunal',
        response: 'I understand your name is Kunal',
        conversationId: 'conv-test-123',
        metadata: {
          memoryType: 'user_query',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_info',
          tags: ['name', 'personal', 'user_info']
        }
      })
    });
    const storageData = await storageResponse.json();
    console.log('Storage result:', storageData);

    // Test 3: Search for the memory
    console.log('\nTesting semantic search for name...');
    const searchResponse = await fetch('http://localhost:3000/api/ai/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        query: 'Do you know my name?',
        limit: 5,
        minSimilarity: 0.1,
        searchType: 'hybrid'
      })
    });
    const searchData = await searchResponse.json();
    console.log('Search result:', searchData);

    // Verify results
    if (searchData.memories && searchData.memories.length > 0) {
      console.log('\n✅ SUCCESS: Found memories for name query');
      console.log('Found memory:', searchData.memories[0]);
    } else {
      console.log('\n❌ WARNING: No memories found for name query');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
testSemanticSearch();

// Also test with alternative approach for name query
const testNameQuery = async () => {
  console.log('\n=== Testing Name Query Scenario ===');
  try {
    // Test direct text search
    const response = await fetch('http://localhost:3000/api/ai/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        query: 'name Kunal',
        limit: 5,
        minSimilarity: 0.1,
        searchType: 'text'  // Force text search
      })
    });

    const result = await response.json();
    console.log('Text search for name query result:', result);
    
  } catch (error) {
    console.error('Name query test failed:', error);
  }
};

// Run name query test
testNameQuery();