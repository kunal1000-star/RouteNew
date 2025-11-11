// Debug Script for Study Buddy 401 Authentication Issues
// ===================================================

const BASE_URL = 'http://localhost:3000';

async function testStudyBuddyEndpoints() {
  console.log('🔍 Testing Study Buddy Authentication and Endpoints...\n');

  // Test 1: Check if study-buddy endpoint exists and responds
  console.log('1. Testing /api/study-buddy endpoint without auth:');
  try {
    const response1 = await fetch(`${BASE_URL}/api/study-buddy`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    if (response1.status === 401) {
      console.log('   ❌ CONFIRMED: Endpoint exists but requires auth (401)');
    } else if (response1.status === 404) {
      console.log('   ❌ CONFIRMED: Endpoint doesn\'t exist (404)');
    } else {
      console.log(`   ⚠️  Unexpected response: ${response1.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  // Test 2: Check if ai/chat endpoint responds
  console.log('\n2. Testing /api/ai/chat endpoint:');
  try {
    const response2 = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, test message',
        userId: 'test-user-123'
      })
    });
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    if (response2.ok) {
      console.log('   ✅ AI chat endpoint is working');
    } else {
      console.log(`   ❌ AI chat endpoint failed: ${response2.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  // Test 3: Check health endpoints
  console.log('\n3. Testing health check endpoints:');
  const healthEndpoints = [
    '/api/chat/health-check',
    '/api/ai/health',
    '/api/ai/chat/health'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`   ${endpoint}: Network error - ${error.message}`);
    }
  }

  console.log('\n🔍 SUMMARY OF FINDINGS:');
  console.log('   - Study Buddy component calls /api/ai/chat in use-study-buddy.ts');
  console.log('   - But /api/study-buddy endpoint exists and expects different auth');
  console.log('   - This creates a disconnect: frontend vs backend endpoint mismatch');
  console.log('   - Users get 401 because they\'re hitting the wrong endpoint');
}

// Run the debug test
testStudyBuddyEndpoints().catch(console.error);