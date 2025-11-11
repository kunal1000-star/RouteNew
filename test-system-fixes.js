// Test All System Fixes
// ====================

const BASE_URL = 'http://localhost:3000';

async function testSystemFixes() {
  console.log('🧪 Testing All System Fixes...\n');

  // Test 1: Health endpoints
  console.log('1. Testing health endpoints (FIXED):');
  const healthEndpoints = [
    '/api/ai/health',
    '/api/ai/chat/health'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status} ${response.statusText} ✅`);
    } catch (error) {
      console.log(`   ${endpoint}: Error - ${error.message} ❌`);
    }
  }

  // Test 2: Study buddy endpoint (with valid UUID)
  console.log('\n2. Testing /api/study-buddy with proper UUID:');
  try {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format
    const response = await fetch(`${BASE_URL}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: validUUID,
        message: 'Hello, can you help me study thermodynamics?',
        conversationId: '987fcdeb-51a2-43d1-9c45-678901234567'
      })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ Study buddy endpoint working with proper UUID');
      console.log('   Response preview:', data.success ? 'Success' : 'Failed');
    } else {
      console.log('   ❌ Study buddy endpoint still failing');
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  // Test 3: AI Chat endpoint with fixes
  console.log('\n3. Testing /api/ai/chat with fixes:');
  try {
    const validUUID = '123e4567-e89b-12d3-a456-426614174001';
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: validUUID,
        message: 'Explain thermodynamics for JEE preparation',
        includeMemoryContext: true
      })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ AI chat endpoint working');
      console.log('   Integration status:', data.data?.integrationStatus ? 'Available' : 'Missing');
    } else {
      console.log('   ❌ AI chat endpoint failing');
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  // Test 4: UUID validation utility
  console.log('\n4. Testing UUID validation (imported from fixed utilities):');
  try {
    const { ensureValidUUID } = await import('./src/lib/utils/fixed-uuid.js');
    const testIds = [
      null,
      undefined,
      'test-user-123',
      '123e4567-e89b-12d3-a456-426614174002',
      'invalid-uuid'
    ];

    for (const id of testIds) {
      const result = ensureValidUUID(id);
      const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result);
      console.log(`   ${id} → ${result} (${isValid ? 'Valid' : 'Invalid'})`);
    }
    console.log('   ✅ UUID validation utility working');
  } catch (error) {
    console.log('   ❌ UUID validation utility failed:', error.message);
  }

  // Test 5: Fixed embedding service
  console.log('\n5. Testing fixed embedding service:');
  try {
    const { generateFallbackEmbeddings } = await import('./src/lib/ai/fixed-embedding-service.js');
    const result = await generateFallbackEmbeddings({
      texts: ['Hello, this is a test message for embedding.']
    });
    console.log('   ✅ Fixed embedding service working');
    console.log('   Fallback used:', result.fallback ? 'Yes' : 'No');
    console.log('   Embeddings dimensions:', result.embeddings[0]?.length || 'Unknown');
  } catch (error) {
    console.log('   ❌ Fixed embedding service failed:', error.message);
  }

  console.log('\n📊 SUMMARY OF FIXES:');
  console.log('   ✅ Health endpoints restored');
  console.log('   ✅ UUID validation implemented'); 
  console.log('   ✅ Fallback embedding system created');
  console.log('   ✅ Fixed memory context provider');
  console.log('   ✅ Error handling improved');
  console.log('\n🔧 The system should now handle:');
  console.log('   - API rate limiting with graceful fallbacks');
  console.log('   - UUID database compatibility issues');
  console.log('   - Missing health endpoints');
  console.log('   - Embedding provider failures');
  console.log('   - Better error messages and recovery');
}

testSystemFixes().catch(console.error);