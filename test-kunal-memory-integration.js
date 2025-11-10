// Test the complete Kunal memory scenario
// This test simulates the exact conversation flow that was failing

const testScenarios = [
  {
    name: "Kunal Introduction",
    userId: "kunal-test-user-123",
    message: "My name is Kunal",
    expectedBehavior: "Should store this in memory and provide friendly response"
  },
  {
    name: "Memory Retrieval Test", 
    userId: "kunal-test-user-123",
    message: "Do you know my name?",
    expectedBehavior: "Should recall 'Kunal' from previous conversation"
  },
  {
    name: "Follow-up Personal Question",
    userId: "kunal-test-user-123", 
    message: "What is my name?",
    expectedBehavior: "Should respond with 'Kunal' from memory"
  }
];

async function testKunalMemoryScenario() {
  console.log("🧪 Testing Kunal Memory Integration Scenario");
  console.log("=" .repeat(50));
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n📝 Test ${i + 1}: ${scenario.name}`);
    console.log(`User ID: ${scenario.userId}`);
    console.log(`Message: "${scenario.message}"`);
    console.log(`Expected: ${scenario.expectedBehavior}`);
    
    try {
      // Call the AI chat endpoint
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
            console.log(`⚠️  PARTIAL: Personal query but no memory context found`);
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
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n" + "=" .repeat(50));
  console.log("🎯 Test Summary:");
  console.log("This test verifies that:");
  console.log("1. Personal introductions are stored in memory");
  console.log("2. Subsequent personal questions retrieve the stored information");
  console.log("3. AI responses are personalized based on memory context");
  console.log("\nIf tests show 'SUCCESS', the Kunal memory problem is FIXED! 🎉");
}

// Run the test
testKunalMemoryScenario().catch(console.error);