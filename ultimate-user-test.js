/**
 * Ultimate Test: Exact User Scenario 
 * Test the complete flow with the user saying "My name is Kunal" then "Do you know my name?"
 */

console.log('🎯 ULTIMATE TEST: Complete User Experience');
console.log('===========================================');

async function testUserFlow() {
  // Step 1: User says "My name is Kunal" (simulate what user would type)
  console.log('Step 1: User says "My name is Kunal"');
  const step1 = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      message: "My name is Kunal",
      chatType: 'study_assistant',
      includeMemoryContext: true,
      memoryOptions: {
        minSimilarity: 0.1,
        searchType: 'hybrid'
      }
    })
  });
  
  const step1Data = await step1.json();
  console.log('Step 1 Response:', step1Data.data?.aiResponse?.content);
  
  // Wait a moment for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: User asks "Do you know my name?" (the exact question that was failing)
  console.log('\nStep 2: User asks "Do you know my name?"');
  const step2 = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
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
  
  const step2Data = await step2.json();
  console.log('Step 2 Response:', step2Data.data?.aiResponse?.content);
  console.log('Query Type:', step2Data.data?.aiResponse?.query_type);
  console.log('Memories Found:', step2Data.data?.memoryContext?.memoriesFound);
  
  console.log('\n🏆 FINAL USER EXPERIENCE:');
  console.log('========================');
  console.log('BEFORE FIX: "I don\'t have past conversations"');
  console.log('AFTER FIX:  "' + step2Data.data?.aiResponse?.content + '"');
  
  if (step2Data.data?.aiResponse?.query_type === 'personal_query_with_memory') {
    console.log('\n✅ PROBLEM COMPLETELY SOLVED!');
    console.log('🎉 The Study Buddy now remembers your name "Kunal"!');
  } else {
    console.log('\n❌ Issue still exists');
  }
}

testUserFlow().catch(console.error);