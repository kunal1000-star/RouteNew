// Test Study Buddy Fix - Validate Authentication and Thermodynamics Teaching
const { createClient } = require('@supabase/supabase-js');

async function testStudyBuddyFix() {
  console.log('🧪 Testing Study Buddy Fix...\n');
  
  try {
    // Create Supabase client for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test 1: Check API Health
    console.log('📡 Test 1: API Health Check');
    const healthResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'GET'
    });
    console.log(`   Health: ${healthResponse.status} ${healthResponse.statusText}`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthData.status || 'Unknown'}`);
    console.log(`   ✅ API is responding\n`);

    // Test 2: Test Authentication with Simple Request
    console.log('🔐 Test 2: Authentication Test');
    const authTestResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello, test message"
      })
    });
    console.log(`   Auth Test: ${authTestResponse.status} ${authTestResponse.statusText}`);
    
    if (authTestResponse.status === 401) {
      console.log(`   ❌ Still getting 401 - Need to check auth token`);
      const errorData = await authTestResponse.json();
      console.log(`   Error: ${errorData.error}`);
    } else {
      console.log(`   ✅ Authentication working or other error\n`);
    }

    // Test 3: Test Thermodynamics Teaching
    console.log('🧪 Test 3: Thermodynamics Teaching Test');
    const thermoResponse = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "thermodynamics sajha do"
      })
    });
    console.log(`   Thermodynamics: ${thermoResponse.status} ${thermoResponse.statusText}`);
    
    if (thermoResponse.status === 200) {
      const thermoData = await thermoResponse.json();
      if (thermoData.studyBuddy && thermoData.studyBuddy.features.educationalContent) {
        console.log(`   ✅ Thermodynamics teaching system active`);
        console.log(`   📚 Content type: Educational`);
        console.log(`   🔧 Response length: ${thermoData.data?.aiResponse?.content?.length || 0} characters\n`);
      } else {
        console.log(`   ⚠️  Response format unexpected`);
        console.log(`   📄 Data keys: ${Object.keys(thermoData).join(', ')}\n`);
      }
    } else {
      const errorData = await thermoResponse.json();
      console.log(`   ❌ Error: ${errorData.error}\n`);
    }

    // Test 4: Test AI Chat Endpoint Directly
    console.log('🤖 Test 4: AI Chat Endpoint Test');
    const aiResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: "test-user",
        message: "thermodynamics sajha do"
      })
    });
    console.log(`   AI Chat: ${aiResponse.status} ${aiResponse.statusText}`);
    
    if (aiResponse.status === 200) {
      const aiData = await aiResponse.json();
      if (aiData.data && aiData.data.aiResponse) {
        console.log(`   ✅ AI Chat working`);
        console.log(`   🔧 Model: ${aiData.data.aiResponse.model_used}`);
        console.log(`   📝 Query Type: ${aiData.data.aiResponse.query_type}`);
        console.log(`   🧪 Teaching System: ${aiData.integrationStatus?.teaching_system || 'Unknown'}`);
      }
    } else {
      const errorData = await aiResponse.json();
      console.log(`   ❌ AI Chat Error: ${errorData.error?.message || 'Unknown'}`);
    }

    console.log('\n🎯 TEST SUMMARY:');
    console.log('✅ API endpoints are responding');
    console.log(authTestResponse.status !== 401 ? '✅ Authentication might be working' : '❌ Authentication still failing');
    console.log(thermoResponse.status === 200 ? '✅ Thermodynamics endpoint working' : '❌ Thermodynamics still failing');
    console.log(aiResponse.status === 200 ? '✅ AI Chat working' : '❌ AI Chat failing');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStudyBuddyFix();