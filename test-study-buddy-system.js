// Comprehensive Study Buddy System Test
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STUDY BUDDY SYSTEM TESTING ===\n');
  
  // Test 1: Basic Study Buddy Chat
  console.log('1. Testing Study Buddy Chat Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/study-buddy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      message: "hello, can you help me with thermodynamics?",
      userId: "550e8400-e29b-41d4-a716-446655440000"
    });
    
    console.log('✅ Study Buddy Chat: SUCCESS');
  } catch (error) {
    console.log('❌ Study Buddy Chat: FAILED -', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: AI Chat Direct (for comparison)
  console.log('2. Testing AI Chat Direct Endpoint...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      userId: "550e8400-e29b-41d4-a716-446655440000",
      message: "thermodynamics sajha do"
    });
    
    console.log('✅ AI Chat Direct: SUCCESS');
    if (response.success && response.data && response.data.aiResponse) {
      console.log('Response preview:', response.data.aiResponse.content.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ AI Chat Direct: FAILED -', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Study Buddy Health Check
  console.log('3. Testing Study Buddy Health Check...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/study-buddy',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Study Buddy Health: SUCCESS');
    console.log('Status:', response.status);
    console.log('Features:', response.features);
  } catch (error) {
    console.log('❌ Study Buddy Health: FAILED -', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Study Buddy with Educational Content
  console.log('4. Testing Educational Content...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/study-buddy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      message: "teach me the first law of thermodynamics for JEE",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      context: { type: "study" }
    });
    
    console.log('✅ Educational Content: SUCCESS');
    if (response.studyBuddy && response.studyBuddy.queryType) {
      console.log('Query Type:', response.studyBuddy.queryType);
    }
  } catch (error) {
    console.log('❌ Educational Content: FAILED -', error.message);
  }
  
  console.log('\n=== TESTING COMPLETE ===');
}

runTests().catch(console.error);