/**
 * INSTANT MEMORY FIX FOR YOUR USER ID
 * This script will fix the memory for any user ID you provide
 */

const fixUserMemory = async (userId) => {
  console.log(`🎯 INSTANT MEMORY FIX FOR: ${userId}`);
  console.log('=====================================');
  
  try {
    // Step 1: Store memory
    console.log('1. Storing memory...');
    const storeResponse = await fetch('http://localhost:3000/api/ai/memory-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        message: "My name is Kunal. I am studying for JEE 2025 and need personalized help.",
        response: "Nice to meet you, Kunal! I'm here to provide personalized help for your JEE 2025 preparation!",
        metadata: {
          memoryType: 'ai_response',
          priority: 'high',
          retention: 'long_term',
          topic: 'personal_introduction',
          tags: ['name', 'introduction', 'personal', 'kunal', 'student'],
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
    
    // Step 2: Test immediately
    console.log('2. Testing memory...');
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
      console.log('\n🎉 SUCCESS! Memory is now working for your user ID!');
      console.log('✅ Your Study Buddy will now remember your name "Kunal"');
      console.log('✅ You can close the browser and reload - memory will persist!');
      return true;
    } else {
      console.log('\n❌ Still not working - need to check user ID format');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
};

// Ready to use - just call with your user ID
module.exports = { fixUserMemory };