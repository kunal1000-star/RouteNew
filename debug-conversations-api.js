
#!/usr/bin/env node

/**
 * Debug script to test the conversations API endpoint
 * This will help identify if the 405 error is due to routing, authentication, or other issues
 */

const fetch = require('node-fetch');
const https = require('https');

async function testConversationsAPI() {
  console.log('🔍 Testing /api/chat/conversations endpoint...\n');

  const testUrl = 'http://localhost:3000/api/chat/conversations?userId=test&chatType=general';
  
  try {
    // Test 1: Basic GET request (no auth)
    console.log('Test 1: GET request without authentication');
    console.log('URL:', testUrl);
    
    const response1 = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response1.status, response1.statusText);
    console.log('Headers:', Object.fromEntries(response1.headers.entries()));
    console.log('Response:', await response1.text());
    console.log('---\n');

    // Test 2: OPTIONS request to check allowed methods
    console.log('Test 2: OPTIONS request to check allowed methods');
    const response2 = await fetch(testUrl, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response2.status, response2.statusText);
    console.log('Headers:', Object.fromEntries(response2.headers.entries()));
    console.log('Response:', await response2.text());
    console.log('---\n');

    // Test 3: Check if specific route paths work
    console.log('Test 3: Testing alternative endpoint paths');
    const endpoints = [
      'http://localhost:3000/api/chat',
      'http://localhost:3000/api/chat/',
      'http://localhost:3000/api/chat/conversations',
      'http://localhost:3000/api/chat/conversations/',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(endpoint, { method: 'GET' });
        console.log(`${endpoint} -> Status: ${resp.status} ${resp.statusText}`);
      } catch (err) {
        console.log(`${endpoint} -> Error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testConversationsAPI();
}

module.exports = { testConversationsAPI };