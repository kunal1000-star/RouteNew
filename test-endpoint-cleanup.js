const fetch = require('node-fetch');

const baseURL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing API endpoints after cleanup...\n');
  
  // Test the unified AI chat endpoint
  try {
    console.log('✅ Testing /api/ai/chat...');
    const response = await fetch(`${baseURL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      console.log('   ❌ ENDPOINT REMOVED - This should still work!');
    } else {
      console.log('   ✅ ENDPOINT EXISTS - Good!');
    }
  } catch (err) {
    console.log('   ⚠️  Connection error (expected if server not running)');
  }
  
  // Test that old chat endpoints return 404
  const oldEndpoints = [
    '/api/chat',
    '/api/chat/conversations',
    '/api/chat/health-check',
    '/api/chat/study-assistant/send'
  ];
  
  for (const endpoint of oldEndpoints) {
    try {
      console.log(`🗑️  Testing ${endpoint} (should be 404)...`);
      const response = await fetch(`${baseURL}${endpoint}`, { method: 'GET' });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        console.log('   ✅ CORRECTLY REMOVED');
      } else {
        console.log('   ❌ STILL EXISTS - Should be removed!');
      }
    } catch (err) {
      console.log('   ⚠️  Connection error');
    }
  }
  
  // Test AI endpoints that should still exist
  const aiEndpoints = [
    '/api/ai/chat',
    '/api/ai/orchestrator', 
    '/api/ai/personalized',
    '/api/ai/memory-storage',
    '/api/ai/semantic-search',
    '/api/ai/web-search',
    '/api/ai/embeddings'
  ];
  
  console.log('\n🎯 Testing existing AI endpoints...');
  for (const endpoint of aiEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      const response = await fetch(`${baseURL}${endpoint}`, { method: 'GET' });
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } catch (err) {
      console.log('   ⚠️  Connection error');
    }
  }
}

testEndpoints();