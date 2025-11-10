/**
 * TEST EXACT USER SCENARIO
 * This tests exactly what happens when user types in Study Buddy
 */

const userId = "322531b3-173d-42a9-be4c-770ad92ac8b8";

async function testExactUserScenario() {
  console.log('🧪 TESTING EXACT USER SCENARIO');
  console.log('User: Types "My name is Kunal"');
  console.log('User: Then asks "Do you know my name?"');
  console.log('=====================================');
  
  // Step 1: Simulate the user typing "My name is Kunal" in Study Buddy
  console.log('1. User says: "My name is Kunal"');
  const firstResponse = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "My name is Kunal",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      includePersonalizedSuggestions: true,
      memoryOptions: {
        query: "My name is Kunal",
        limit: 5,
        minSimilarity: 0.1, // The current frontend parameter
        searchType: 'hybrid'
      }
    })
  });
  
  const firstData = await firstResponse.json();
  console.log(`Response: ${firstData.data?.aiResponse?.content?.substring(0, 100)}...`);
  
  // Step 2: Wait a moment for storage
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Simulate the user asking "Do you know my name?"
  console.log('\n2. User asks: "Do you know my name?"');
  const secondResponse = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: "Do you know my name?",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      includePersonalizedSuggestions: true,
      memoryOptions: {
        query: "Do you know my name?",
        limit: 5,
        minSimilarity: 0.1, // The current frontend parameter
        searchType: 'hybrid'
      }
    })
  });
  
  const secondData = await secondResponse.json();
  console.log(`Query Type: ${secondData.data?.aiResponse?.query_type}`);
  console.log(`Memories Found: ${secondData.data?.memoryContext?.memoriesFound}`);
  console.log(`Response: ${secondData.data?.aiResponse?.content}`);
  
  // Test if this gives the right result
  if (secondData.data?.aiResponse?.query_type === 'personal_query_with_memory') {
    console.log('\n✅ SUCCESS! This should work in your Study Buddy!');
    console.log('🎉 Your memory is now working correctly!');
  } else {
    console.log('\n❌ The issue is with the frontend parameters');
    console.log('The memory is stored but search parameters are too restrictive');
    
    // Try with more permissive parameters
    console.log('\n3. Testing with more permissive parameters...');
    const thirdResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        message: "Do you know my name?",
        chatType: 'study_assistant',
        includeMemoryContext: true,
        includePersonalizedSuggestions: true,
        memoryOptions: {
          query: "Do you know my name?",
          limit: 10,
          minSimilarity: 0.01, // Much more permissive
          searchType: 'text' // Text search
        }
      })
    });
    
    const thirdData = await thirdResponse.json();
    console.log(`With permissive params:`);
    console.log(`Query Type: ${thirdData.data?.aiResponse?.query_type}`);
    console.log(`Response: ${thirdData.data?.aiResponse?.content}`);
  }
}

testExactUserScenario().catch(console.error);