// Debug Script for Chat Service Initialization Issues
// =================================================

console.log('🔍 Starting Chat Service Initialization Debug...');

// Test 1: Check if provider modules exist and can be imported
async function testProviderImports() {
  console.log('\n📦 Testing Provider Module Imports...');
  
  const providers = ['groq', 'cerebras', 'mistral', 'openrouter', 'gemini', 'cohere'];
  const results = {};
  
  for (const provider of providers) {
    try {
      console.log(`Testing ${provider}...`);
      const module = await import(`./src/lib/ai/providers/${provider}-unified.js`);
      console.log(`✅ ${provider} unified module imported successfully`);
      results[provider] = { unified: true, error: null };
    } catch (unifiedError) {
      console.log(`⚠️ ${provider} unified module failed:`, unifiedError.message);
      try {
        const regularModule = await import(`./src/lib/ai/providers/${provider}.js`);
        console.log(`✅ ${provider} regular module imported successfully`);
        results[provider] = { unified: false, regular: true, error: null };
      } catch (regularError) {
        console.log(`❌ ${provider} regular module also failed:`, regularError.message);
        results[provider] = { unified: false, regular: false, error: regularError.message };
      }
    }
  }
  
  return results;
}

// Test 2: Check chat service initialization
async function testChatServiceInit() {
  console.log('\n🤖 Testing Chat Service Initialization...');
  
  try {
    // Test unified provider registry
    const { UnifiedProviderRegistry } = await import('./src/lib/ai/chat/provider-registry.js');
    console.log('✅ UnifiedProviderRegistry imported successfully');
    
    const config = {
      defaultProvider: 'groq',
      fallbackProviders: ['cerebras', 'mistral'],
      timeout: 30000,
      maxRetries: 3
    };
    
    const registry = new UnifiedProviderRegistry(config);
    console.log('✅ Registry created successfully');
    
    // Test base unified provider
    const { BaseUnifiedProvider } = await import('./src/lib/ai/chat/unified-provider.js');
    console.log('✅ BaseUnifiedProvider imported successfully');
    
    return { success: true, registry };
  } catch (error) {
    console.log('❌ Chat service initialization failed:', error.message);
    console.log('Stack trace:', error.stack);
    return { success: false, error: error.message, stack: error.stack };
  }
}

// Test 3: Check configuration manager
async function testConfigManager() {
  console.log('\n⚙️ Testing Configuration Manager...');
  
  try {
    const { ChatConfigurationManager } = await import('./src/lib/ai/chat/configuration-manager.js');
    console.log('✅ ChatConfigurationManager imported successfully');
    
    // Test with a simple registry
    const { UnifiedProviderRegistry } = await import('./src/lib/ai/chat/provider-registry.js');
    const registry = new UnifiedProviderRegistry({
      defaultProvider: 'groq',
      fallbackProviders: ['cerebras']
    });
    
    const configManager = new ChatConfigurationManager(registry);
    console.log('✅ Configuration manager created successfully');
    
    return { success: true, configManager };
  } catch (error) {
    console.log('❌ Configuration manager failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Check index module
async function testIndexModule() {
  console.log('\n📋 Testing Index Module...');
  
  try {
    const indexModule = await import('./src/lib/ai/chat/index.js');
    console.log('✅ Index module imported successfully');
    
    // Test if getInitializedChatService exists
    if (typeof indexModule.getInitializedChatService === 'function') {
      console.log('✅ getInitializedChatService function exists');
    } else {
      console.log('⚠️ getInitializedChatService function not found');
    }
    
    return { success: true, exports: Object.keys(indexModule) };
  } catch (error) {
    console.log('❌ Index module failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 5: Simulate API route initialization
async function simulateApiRouteInit() {
  console.log('\n🚀 Simulating API Route Initialization...');
  
  try {
    // Simulate what happens in the API route
    console.log('Attempting to get initialized chat service...');
    
    const indexModule = await import('./src/lib/ai/chat/index.js');
    const getChatService = indexModule.getInitializedChatService;
    
    if (getChatService) {
      const chatService = await getChatService();
      console.log('✅ Chat service initialized successfully via index module');
      return { success: true, serviceType: typeof chatService };
    } else {
      console.log('❌ getInitializedChatService not found in index module');
      return { success: false, error: 'Function not found' };
    }
  } catch (error) {
    console.log('❌ API route simulation failed:', error.message);
    console.log('Full error:', error);
    return { success: false, error: error.message, stack: error.stack };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Chat Service Debug Tests...\n');
  
  const results = {
    providerImports: await testProviderImports(),
    chatServiceInit: await testChatServiceInit(),
    configManager: await testConfigManager(),
    indexModule: await testIndexModule(),
    apiRouteSim: await simulateApiRouteInit()
  };
  
  console.log('\n📊 DEBUG SUMMARY:');
  console.log('=================');
  
  console.log('\n🔌 Provider Import Status:');
  Object.entries(results.providerImports).forEach(([provider, status]) => {
    if (status.unified) {
      console.log(`  ✅ ${provider}: Unified module available`);
    } else if (status.regular) {
      console.log(`  ⚠️ ${provider}: Only regular module available`);
    } else {
      console.log(`  ❌ ${provider}: No modules available - ${status.error}`);
    }
  });
  
  console.log('\n🤖 Service Initialization:');
  if (results.chatServiceInit.success) {
    console.log('  ✅ Chat service components loaded successfully');
  } else {
    console.log('  ❌ Chat service initialization failed');
    console.log('  Error:', results.chatServiceInit.error);
  }
  
  console.log('\n⚙️ Configuration Manager:');
  if (results.configManager.success) {
    console.log('  ✅ Configuration manager loaded successfully');
  } else {
    console.log('  ❌ Configuration manager failed');
    console.log('  Error:', results.configManager.error);
  }
  
  console.log('\n📋 Index Module:');
  if (results.indexModule.success) {
    console.log('  ✅ Index module loaded successfully');
    console.log('  Available exports:', results.indexModule.exports.join(', '));
  } else {
    console.log('  ❌ Index module failed');
    console.log('  Error:', results.indexModule.error);
  }
  
  console.log('\n🚀 API Route Simulation:');
  if (results.apiRouteSim.success) {
    console.log('  ✅ API route initialization would succeed');
    console.log('  Service type:', results.apiRouteSim.serviceType);
  } else {
    console.log('  ❌ API route initialization would fail');
    console.log('  Error:', results.apiRouteSim.error);
    if (results.apiRouteSim.stack) {
      console.log('  Stack:', results.apiRouteSim.stack);
    }
  }
  
  return results;
}

// Execute the debug
runAllTests().then(results => {
  console.log('\n🎯 RECOMMENDATION:');
  console.log('=================');
  
  if (!results.apiRouteSim.success) {
    console.log('❌ API routes will fail due to chat service initialization issues');
    console.log('🔧 Need to fix chat service initialization or add proper error handling');
  } else {
    console.log('✅ Chat service should work, check other potential issues');
  }
  
  console.log('\n🏁 Debug complete!');
}).catch(error => {
  console.error('💥 Debug script failed:', error);
});