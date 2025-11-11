// Simple Study Buddy Test - Direct API testing without environment variables
async function testStudyBuddy() {
  console.log('🧪 Testing Study Buddy Fix (Simple)...\n');
  
  try {
    // Test 1: API Health Check
    console.log('📡 Test 1: Study Buddy API Health');
    const healthResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'GET'
    });
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Status: ${healthData.status || 'Unknown'}`);
      console.log(`   ✅ Study Buddy API is responding\n`);
    } else {
      console.log(`   ❌ Study Buddy API not responding\n`);
    }

    // Test 2: Basic message without auth
    console.log('📝 Test 2: Basic Message Test');
    const messageResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello, basic test"
      })
    });
    console.log(`   Status: ${messageResponse.status} ${messageResponse.statusText}`);
    
    if (messageResponse.status === 401) {
      console.log(`   ❌ Still getting 401 - Authentication required`);
      const errorData = await messageResponse.json();
      console.log(`   Error: ${errorData.error}\n`);
    } else {
      console.log(`   ✅ No 401 error\n`);
    }

    // Test 3: Thermodynamics Teaching Test
    console.log('🧪 Test 3: Thermodynamics Teaching');
    const thermoResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "thermodynamics sajha do"
      })
    });
    console.log(`   Status: ${thermoResponse.status} ${thermoResponse.statusText}`);
    
    if (thermoResponse.status === 200) {
      const thermoData = await thermoResponse.json();
      console.log(`   ✅ Response received`);
      console.log(`   📄 Success: ${thermoData.success || 'Unknown'}`);
      console.log(`   📚 Study Buddy Active: ${thermoData.studyBuddy?.isStudyBuddy || 'Unknown'}`);
      
      if (thermoData.data && thermoData.data.aiResponse) {
        const content = thermoData.data.aiResponse.content;
        console.log(`   📝 Content Length: ${content.length} characters`);
        
        // Check if it's thermodynamics content
        if (content.toLowerCase().includes('thermodynamic') || 
            content.toLowerCase().includes('heat') ||
            content.toLowerCase().includes('energy') ||
            content.toLowerCase().includes('temperature')) {
          console.log(`   ✅ Contains thermodynamics content!`);
        } else {
          console.log(`   ⚠️  Response doesn't seem to be thermodynamics focused`);
        }
      }
    } else {
      const errorData = await thermoResponse.json();
      console.log(`   ❌ Error: ${errorData.error}\n`);
    }

    // Test 4: Direct AI Chat Test (for comparison)
    console.log('🤖 Test 4: Direct AI Chat Test');
    const aiResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: "test-user",
        message: "thermodynamics sajha do"
      })
    });
    console.log(`   Status: ${aiResponse.status} ${aiResponse.statusText}`);
    
    if (aiResponse.status === 200) {
      const aiData = await aiResponse.json();
      console.log(`   ✅ AI Chat working`);
      console.log(`   🔧 Model: ${aiData.data?.aiResponse?.model_used || 'Unknown'}`);
      console.log(`   📝 Query Type: ${aiData.data?.aiResponse?.query_type || 'Unknown'}`);
      console.log(`   🧪 Teaching: ${aiData.integrationStatus?.teaching_system || 'Unknown'}`);
    } else {
      const errorData = await aiResponse.json();
      console.log(`   ❌ AI Chat Error: ${errorData.error?.message || 'Unknown'}`);
    }

    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log(`📡 Study Buddy Health: ${healthResponse.ok ? '✅' : '❌'}`);
    console.log(`🔐 Auth Test: ${messageResponse.status === 401 ? '❌ Still 401' : '✅ No 401'}`);
    console.log(`🧪 Thermodynamics: ${thermoResponse.status === 200 ? '✅ Working' : '❌ Failing'}`);
    console.log(`🤖 AI Chat: ${aiResponse.status === 200 ? '✅ Working' : '❌ Failing'}`);
    
    // Recommendations
    if (messageResponse.status === 401) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix authentication - users need valid tokens');
      console.log('2. Ensure Supabase auth is working');
      console.log('3. Check browser console for auth errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStudyBuddy();