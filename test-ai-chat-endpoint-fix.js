// Test AI Chat Endpoint Fix
// =========================

const fetch = require('node-fetch');

async function testAIChatEndpoint() {
  console.log('🧪 Testing AI Chat Endpoint Fix...\n');
  
  const baseUrl = 'http://localhost:3000';
  const testCases = [
    {
      name: 'Thermodynamics Question',
      message: 'thermodynamics sajha do',
      userId: 'test-user-123'
    },
    {
      name: 'General Study Question',
      message: 'explain quantum mechanics',
      userId: 'test-user-456'
    },
    {
      name: 'Personal Query',
      message: 'do you know my name',
      userId: 'test-user-789'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testCase.userId,
          message: testCase.message,
          chatType: 'study_assistant',
          includeMemoryContext: true
        })
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.success) {
        const aiResponse = data.data.aiResponse;
        console.log(`✅ Success!`);
        console.log(`📝 Response length: ${aiResponse.content.length} characters`);
        console.log(`🤖 Model used: ${aiResponse.model_used}`);
        console.log(`🔧 Provider used: ${aiResponse.provider_used}`);
        console.log(`⚡ Tokens used: ${aiResponse.tokens_used}`);
        console.log(`⏱️ Latency: ${aiResponse.latency_ms}ms`);
        console.log(`🔄 Fallback used: ${aiResponse.fallback_used}`);
        console.log(`💾 Cached: ${aiResponse.cached}`);
        console.log(`🧠 Memory context: ${data.data.personalizedSuggestions?.memory_context_used ? 'Yes' : 'No'}`);
        console.log(`📋 Memories found: ${data.data.personalizedSuggestions?.memories_found || 0}`);
        
        // Check if response is generic or actual AI content
        const isGeneric = aiResponse.content.includes('I understand you\'re asking about') ||
                         aiResponse.content.includes('Based on our conversation history') ||
                         aiResponse.content.includes('I can see from our conversation history');
        
        if (isGeneric) {
          console.log(`⚠️  WARNING: Response appears to be generic/template`);
        } else {
          console.log(`✅ GOOD: Response appears to be actual AI-generated content`);
        }
        
        console.log(`📄 Response preview: ${aiResponse.content.substring(0, 200)}...`);
        
      } else {
        console.error(`❌ API Error:`, data.error);
      }
      
    } catch (error) {
      console.error(`❌ Network Error:`, error.message);
    }
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ If responses are actual AI content (not generic templates), the fix is working!');
  console.log('⚠️  If responses are still generic, there may be additional issues to investigate.');
}

// Run the test
testAIChatEndpoint().catch(console.error);