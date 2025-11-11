// Test Embedding Service Fix
const { generateEmbeddings } = require('./src/lib/ai/unified-embedding-service');

async function testEmbeddingService() {
  console.log('🧪 Testing Embedding Service...\n');
  
  try {
    console.log('📡 Test 1: Check Environment Variables');
    console.log(`   MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   COHERE_API_KEY: ${process.env.COHERE_API_KEY ? '✅ Set' : '❌ Missing'}\n`);

    console.log('🤖 Test 2: Generate Embeddings with Cohere');
    const testTexts = ['Hello world', 'Thermodynamics is the study of heat and energy'];
    
    try {
      const result = await generateEmbeddings({
        texts: testTexts,
        provider: 'cohere'
      });
      console.log(`   ✅ Cohere embedding successful`);
      console.log(`   📊 Dimensions: ${result.dimensions}`);
      console.log(`   🔧 Provider: ${result.provider}`);
      console.log(`   📝 Embeddings generated: ${result.embeddings.length}`);
    } catch (error) {
      console.log(`   ❌ Cohere embedding failed: ${error.message}`);
    }

    console.log('\n🎯 TEST SUMMARY:');
    console.log('The embedding service should now work with Cohere API key');
    console.log('If it still fails, the issue might be in the provider initialization');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmbeddingService();