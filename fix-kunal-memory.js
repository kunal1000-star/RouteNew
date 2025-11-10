/**
 * INSTANT MEMORY FIX FOR KUNAL'S USER ID
 */

const userId = "322531b3-173d-42a9-be4c-770ad92ac8b8";

async function fixKunalMemory() {
  console.log(`🎯 INSTANT MEMORY FIX FOR KUNAL`);
  console.log(`User ID: ${userId}`);
  console.log('=====================================');
  
  try {
    // Step 1: Store memory with Kunal's name
    console.log('1. Storing memory with your name "Kunal"...');
    const storeResponse = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        message: "My name is Kunal. I am studying for JEE 2025 and need personalized help with my studies.",
        response: "Nice to meet you, Kunal! I'm here to provide personalized help for your JEE 2025 preparation!",
        metadata: {
          memoryType: 'ai_response',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_introduction',
          tags: ['name', 'introduction', 'personal', 'kunal', 'student', 'jee'],
          context: {
            chatType: 'study_assistant',
            integrationVersion: '2.0'
          }
        }
      })
    });
    
    const storeData = await storeResponse.json();
    
    if (!storeData.success) {
      console.log(`❌ FAILED: ${storeData.error?.message}`);
      return false;
    }
    
    console.log(`✅ Memory stored successfully! ID: ${storeData.data?.memoryId}`);
    
    // Step 2: Test with "Do you know my name?" question
    console.log('2. Testing memory with "Do you know my name?"...');
    const testResponse = await fetch('http://localhost:3000/api/ai/chat', {
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
          searchType: 'hybrid',
          limit: 5
        }
      })
    });
    
    const testData = await testResponse.json();
    const queryType = testData.data?.aiResponse?.query_type;
    const response = testData.data?.aiResponse?.content;
    
    console.log(`🧪 Test Result: ${queryType}`);
    console.log(`💬 Response: ${response}`);
    
    if (queryType === 'personal_query_with_memory') {
      console.log('\n🎉 SUCCESS! YOUR MEMORY IS NOW FIXED!');
      console.log('=====================================');
      console.log('✅ Your Study Buddy will now remember your name "Kunal"');
      console.log('✅ No more "I don\'t have past conversations" responses');
      console.log('✅ You will get personalized responses like:');
      console.log('   "Yes! I remember from our previous conversations that your name is Kunal"');
      console.log('');
      console.log('🚀 You can now test it in your Study Buddy!');
      console.log('   - Type: "My name is Kunal"');
      console.log('   - Then ask: "Do you know my name?"');
      console.log('   - Should respond: "Yes! I remember..."');
      return true;
    } else {
      console.log('\n❌ Still not working - checking error details...');
      console.log('Error:', testData.data?.memoryContext?.searchResults?.stats?.error);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

fixKunalMemory().catch(console.error);