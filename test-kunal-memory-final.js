// Final test with proper UUIDs - The Kunal memory scenario with real UUIDs
console.log("🎯 FINAL MEMORY TEST - Kunal Scenario with Proper UUIDs");
console.log("=" .repeat(55));

// Use a real UUID for testing
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';
const testScenarios = [
  {
    name: "1. Kunal Introduction",
    userId: TEST_USER_ID,
    message: "My name is Kunal",
    expectedBehavior: "Should store 'Kunal' in memory and provide friendly response"
  },
  {
    name: "2. Memory Retrieval Test", 
    userId: TEST_USER_ID,
    message: "Do you know my name?",
    expectedBehavior: "Should recall 'Kunal' from previous conversation"
  },
  {
    name: "3. Name Confirmation",
    userId: TEST_USER_ID, 
    message: "What is my name?",
    expectedBehavior: "Should respond with 'Kunal' from memory"
  }
];

async function testKunalMemoryWithRealUUIDs() {
  console.log(`🧪 Using Test User ID: ${TEST_USER_ID}\n`);
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n📝 ${scenario.name}`);
    console.log(`Message: "${scenario.message}"`);
    console.log(`Expected: ${scenario.expectedBehavior}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: scenario.userId,
          message: scenario.message,
          chatType: 'study_assistant',
          includeMemoryContext: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Response: "${result.data.aiResponse.content}"`);
        console.log(`📊 Memories Found: ${result.data.memoryContext?.memoriesFound || 0}`);
        console.log(`🔍 Query Type: ${result.data.aiResponse.query_type}`);
        
        // Check if this is a personal query and if memory was used correctly
        const isPersonalQuery = scenario.message.toLowerCase().includes('my name') || 
                               scenario.message.toLowerCase().includes('do you know') ||
                               scenario.message.toLowerCase().includes('what is my');
                               
        if (isPersonalQuery) {
          if (result.data.aiResponse.query_type.includes('with_memory')) {
            console.log(`🎉 SUCCESS: Personal query with memory context used!`);
          } else if (result.data.aiResponse.query_type.includes('no_memory')) {
            console.log(`⚠️  PARTIAL: Personal query but no memory found yet`);
          } else {
            console.log(`❌ ISSUE: Personal query not handled properly`);
          }
        }
      } else {
        console.log(`❌ API Error: ${result.error?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Add delay between tests to ensure storage completion
    if (i < testScenarios.length - 1) {
      console.log(`⏳ Waiting 2 seconds for memory storage to complete...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n" + "=" .repeat(55));
  console.log("🎯 FINAL VERDICT:");
  console.log("If Test 2 & 3 show SUCCESS, your Kunal memory problem is FIXED! 🎉");
  console.log("AI will no longer say 'I don't have past memories' ❌");
  console.log("Instead, it will remember 'Yes, your name is Kunal!' ✅");
}

testKunalMemoryWithRealUUIDs().catch(console.error);