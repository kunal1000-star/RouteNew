// Test script for the main AI chat endpoint
// Tests the full integration of AI processing, memory, search, and personalization

const testChatEndpoint = async () => {
  console.log('🧪 Testing Main AI Chat Endpoint Integration...\n');

  const baseUrl = 'http://localhost:3000';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  // Test payload that demonstrates memory-aware, personalized AI responses
  const testPayload = {
    userId: testUserId,
    message: "Do you know my name?",
    conversationId: `conv-test-${Date.now()}`,
    chatType: "study_assistant",
    includeMemoryContext: true,
    includePersonalizedSuggestions: true,
    memoryOptions: {
      query: "Do you know my name?",
      limit: 3,
      minSimilarity: 0.5,
      searchType: "hybrid",
      contextLevel: "balanced"
    },
    preferences: {
      preferredProvider: "groq",
      maxResponseLength: 500
    },
    metadata: {
      sessionId: `session-${Date.now()}`,
      clientInfo: {
        userAgent: "AI-Chat-Test/1.0",
        timestamp: new Date().toISOString()
      }
    }
  };

  try {
    console.log('📤 Sending request to /api/ai/chat...');
    console.log('Request payload:', JSON.stringify(testPayload, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Chat-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ AI Chat request successful!');
      console.log('\n📊 Response Summary:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - AI Provider: ${result.data?.aiResponse?.provider}`);
      console.log(`   - Model Used: ${result.data?.aiResponse?.model_used}`);
      console.log(`   - Memories Found: ${result.data?.memoryContext?.memoriesFound || 0}`);
      console.log(`   - Suggestions Count: ${result.data?.personalizedSuggestions?.suggestions?.length || 0}`);
      console.log(`   - Total Processing Time: ${result.data?.processingStats?.totalTimeMs}ms`);

      console.log('\n🤖 AI Response:');
      console.log(result.data?.aiResponse?.content);

      if (result.data?.memoryContext?.contextSummary) {
        console.log('\n🧠 Memory Context:');
        console.log(`   ${result.data.memoryContext.contextSummary}`);
      }

      if (result.data?.personalizedSuggestions?.suggestions?.length > 0) {
        console.log('\n💡 Personalized Suggestions:');
        result.data.personalizedSuggestions.suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.title}`);
          console.log(`      ${suggestion.description.substring(0, 100)}...`);
        });
      }

      console.log('\n⏱️  Performance Breakdown:');
      const stats = result.data?.processingStats;
      if (stats) {
        console.log(`   - AI Processing: ${stats.aiProcessingTime}ms`);
        console.log(`   - Memory Search: ${stats.memorySearchTime}ms`);
        console.log(`   - Personalized: ${stats.personalizedTime}ms`);
        console.log(`   - Memory Storage: ${stats.memoryStorageTime}ms`);
      }

    } else {
      console.log('❌ AI Chat request failed:');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log('Error details:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.log('❌ Request failed with error:');
    console.log(error.message);
    console.log('\n🔧 Make sure the development server is running:');
    console.log('   npm run dev');
  }
};

// Test the health check endpoint
const testHealthCheck = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🏥 Testing AI Chat Health Check...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/ai/chat?action=health`);
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Health check successful!');
      console.log('System status:', result.data?.status);
      
      const services = result.data?.system?.services;
      if (services) {
        console.log('\n🔍 Service Status:');
        Object.entries(services).forEach(([name, service]) => {
          const status = service.status === 'healthy' ? '✅' : '❌';
          console.log(`   ${status} ${name}: ${service.status}`);
          if (service.error) {
            console.log(`      Error: ${service.error}`);
          }
        });
      }
    } else {
      console.log('❌ Health check failed:');
      console.log(result);
    }

  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
};

// Run tests
(async () => {
  await testChatEndpoint();
  await testHealthCheck();
})();