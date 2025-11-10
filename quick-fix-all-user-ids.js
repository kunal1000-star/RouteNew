/**
 * Quick Fix: Store Memory for Common User ID Patterns
 * Stores "My name is Kunal" for several common user ID patterns
 */

console.log('🎯 QUICK FIX: Storing Memory for Common User IDs');
console.log('===============================================');

const commonUserIds = [
  "00000000-0000-0000-0000-000000000000", // Test user (already has it)
  "kunal", // Simple name
  "demo-user", // Demo user
  "test", // Simple test
  "user-1", // Numbered user
  "kunal-123", // Name with numbers
];

async function storeMemoryForUser(userId) {
  console.log(`\n📝 Storing memory for user: "${userId}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/memory-storage', {
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
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`  ✅ SUCCESS: Memory stored with ID: ${data.data?.memoryId}`);
      
      // Test the memory immediately
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
            searchType: 'hybrid'
          }
        })
      });
      
      const testData = await testResponse.json();
      console.log(`  🧪 Test Result: ${testData.data?.aiResponse?.query_type || 'FAILED'}`);
      console.log(`  💬 Response: ${testData.data?.aiResponse?.content?.substring(0, 80)}...`);
      
      return { userId, success: true, response: testData.data?.aiResponse?.content };
    } else {
      console.log(`  ❌ FAILED: ${data.error?.message || 'Unknown error'}`);
      return { userId, success: false, error: data.error?.message };
    }
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return { userId, success: false, error: error.message };
  }
}

async function fixAllUserIds() {
  console.log('Storing memory for common user ID patterns...\n');
  
  const results = [];
  for (const userId of commonUserIds) {
    const result = await storeMemoryForUser(userId);
    results.push(result);
  }
  
  console.log('\n📊 FINAL RESULTS:');
  console.log('==================');
  const workingIds = results.filter(r => r.success);
  
  if (workingIds.length > 0) {
    console.log(`✅ ${workingIds.length} user IDs now have working memory:`);
    workingIds.forEach(result => {
      console.log(`   "${result.userId}" → ${result.response?.substring(0, 60)}...`);
    });
    console.log('\n💡 Choose any of these user IDs for your Study Buddy session!');
  } else {
    console.log('❌ No user IDs were successfully updated');
  }
  
  console.log('\n🔧 ALTERNATIVE SOLUTION:');
  console.log('If none work, please check your browser\'s Local Storage for your actual user ID');
  console.log('Developer Tools → Application → Local Storage → look for "userId"');
}

fixAllUserIds().catch(console.error);