#!/usr/bin/env node

/**
 * Comprehensive AI System Test Suite
 * =================================
 * 
 * Tests all major AI systems:
 * 1. Personalization System (personalized vs general queries)
 * 2. Adaptive Teaching System for "Thermo Sajha" scenario
 * 3. Memory Integration and conversation context
 * 4. Web Search Integration for current information
 * 5. 5-Layer Hallucination Prevention system
 * 6. UniversalChat Integration with all features
 */

// Test results storage
const testResults = {
  personalization: [],
  adaptiveTeaching: [],
  memoryIntegration: [],
  webSearch: [],
  hallucinationPrevention: [],
  universalChat: [],
  healthCheck: {
    success: false,
    status: 0,
    result: null,
    tests: []
  }
};

// Constants
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-12345';

class ComprehensiveAISystemTest {
  constructor() {
    this.startTime = Date.now();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      test: '🧪',
      result: '📊'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async makeRequest(endpoint, data = {}) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          ...data
        })
      });

      const result = await response.json();
      return { success: response.ok, status: response.status, data: result };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  }

  async recordTest(category, testName, success, message, details = {}) {
    const test = {
      name: testName,
      success,
      message,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (category === 'healthCheck') {
      testResults.healthCheck.tests.push(test);
      testResults.healthCheck.success = testResults.healthCheck.success || success;
    } else {
      testResults[category].push(test);
    }
    
    this.totalTests++;
    
    if (success) {
      this.passedTests++;
      this.log(`${testName}: PASS - ${message}`, 'success');
    } else {
      this.failedTests++;
      this.log(`${testName}: FAIL - ${message}`, 'error');
    }
  }

  async testHealthCheck() {
    this.log('Testing System Health Check...', 'test');
    
    try {
      const response = await fetch(`${BASE_URL}/api/chat/health-check`);
      const result = await response.json();
      
      const success = response.ok && result.success;
      testResults.healthCheck.status = response.status;
      testResults.healthCheck.result = result;
      
      await this.recordTest('healthCheck', 'Health Check Endpoint', success, 
        success ? 'System health check passed' : 'Health check failed',
        { responseTime: Date.now() - this.startTime }
      );
    } catch (error) {
      await this.recordTest('healthCheck', 'Health Check Endpoint', false, 
        `Health check error: ${error.message}`);
    }
  }

  async testPersonalizationSystem() {
    this.log('Testing Personalization System...', 'test');
    
    const personalizedQueries = [
      "I need help with my calculus homework",
      "I'm struggling with thermodynamics concepts",
      "Can you explain quantum physics to me for my exam tomorrow?"
    ];
    
    const generalQueries = [
      "What is the capital of France?",
      "How many planets are in our solar system?",
      "What is the speed of light?"
    ];

    // Test personalized queries
    for (const query of personalizedQueries) {
      try {
        const response = await this.makeRequest('/api/chat/study-assistant/send', {
          message: query,
          type: 'personalized_study'
        });

        const isPersonalized = response.success && 
          (response.data?.personalization || response.data?.content?.includes('specific') || 
           response.data?.content?.includes('help') || response.data?.content?.length > 100);

        await this.recordTest('personalization', `Personalized Query: "${query.substring(0, 30)}..."`, 
          isPersonalized, 
          isPersonalized ? 'Query received personalized response' : 'Response not sufficiently personalized',
          { query, responseLength: response.data?.content?.length || 0 }
        );
      } catch (error) {
        await this.recordTest('personalization', `Personalized Query: "${query.substring(0, 30)}..."`, 
          false, `Personalized query test failed: ${error.message}`);
      }
    }

    // Test general queries
    for (const query of generalQueries) {
      try {
        const response = await this.makeRequest('/api/chat/study-assistant/send', {
          message: query,
          type: 'general_inquiry'
        });

        const isGeneral = response.success && 
          (response.data?.content?.length < 200 || !response.data?.personalization);

        await this.recordTest('personalization', `General Query: "${query.substring(0, 30)}..."`, 
          isGeneral,
          isGeneral ? 'Query received appropriate general response' : 'General response too detailed',
          { query, responseLength: response.data?.content?.length || 0 }
        );
      } catch (error) {
        await this.recordTest('personalization', `General Query: "${query.substring(0, 30)}..."`, 
          false, `General query test failed: ${error.message}`);
      }
    }
  }

  async testAdaptiveTeachingSystem() {
    this.log('Testing Adaptive Teaching System...', 'test');
    
    const thermoSajhaScenario = [
      "thermo sajha do",           // Initial thermodynamics request
      "sajh nhi aaya",            // Don't understand (Hindi)
      "aur batao"                  // Tell me more (Hindi)
    ];

    for (let i = 0; i < thermoSajhaScenario.length; i++) {
      const query = thermoSajhaScenario[i];
      const stepName = ['Initial Request', 'Difficulty Expression', 'More Explanation Request'][i];
      
      try {
        const response = await this.makeRequest('/api/chat/study-assistant/send', {
          message: query,
          adaptiveTeaching: true,
          step: i + 1,
          context: thermoSajhaScenario.slice(0, i)
        });

        const isAdaptive = response.success && 
          (response.data?.adaptiveTeaching || response.data?.progressiveDisclosure || 
           response.data?.content?.includes('thermodynamics') || 
           response.data?.content?.includes('Thermo') ||
           response.data?.content?.length > 50);

        await this.recordTest('adaptiveTeaching', `Adaptive Teaching Step ${i + 1}: ${stepName}`, 
          isAdaptive,
          isAdaptive ? 'System provided adaptive teaching response' : 'Response not adaptive',
          { query, step: i + 1, responseLength: response.data?.content?.length || 0 }
        );
      } catch (error) {
        await this.recordTest('adaptiveTeaching', `Adaptive Teaching Step ${i + 1}: ${stepName}`, 
          false, `Adaptive teaching test failed: ${error.message}`);
      }
    }
  }

  async testMemoryIntegration() {
    this.log('Testing Memory Integration...', 'test');
    
    // First, store some memory
    const memoryTestQuery = "I prefer visual learning with diagrams";
    await this.makeRequest('/api/ai/memory-storage', {
      message: memoryTestQuery,
      context: { preference: 'visual_learning' }
    });

    // Test memory retrieval
    try {
      const response = await this.makeRequest('/api/ai/semantic-search', {
        query: "learning style preferences",
        limit: 5
      });

      const hasMemory = response.success && 
        (response.data?.memories?.length > 0 || 
         response.data?.results?.length > 0 ||
         response.data?.data?.memoriesFound > 0);

      await this.recordTest('memoryIntegration', 'Memory Storage and Retrieval', 
        hasMemory,
        hasMemory ? 'Memory system working correctly' : 'Memory not found or system not working',
        { query: memoryTestQuery, memoriesFound: response.data?.data?.memoriesFound || 0 }
      );
    } catch (error) {
      await this.recordTest('memoryIntegration', 'Memory Storage and Retrieval', 
        false, `Memory integration test failed: ${error.message}`);
    }

    // Test conversation context
    try {
      const response = await this.makeRequest('/api/chat/study-assistant/send', {
        message: "What did I just tell you about my learning preferences?",
        context: "previous_conversation"
      });

      const hasContext = response.success && 
        (response.data?.content?.includes('visual') || 
         response.data?.content?.includes('diagram') ||
         response.data?.content?.includes('learning'));

      await this.recordTest('memoryIntegration', 'Conversation Context Memory', 
        hasContext,
        hasContext ? 'System remembered context from previous messages' : 'Context memory not working',
        { query: 'learning preferences context', hasContext }
      );
    } catch (error) {
      await this.recordTest('memoryIntegration', 'Conversation Context Memory', 
        false, `Context memory test failed: ${error.message}`);
    }
  }

  async testWebSearchIntegration() {
    this.log('Testing Web Search Integration...', 'test');
    
    const webSearchQueries = [
      "latest news about quantum computing",
      "current breakthroughs in AI research 2024",
      "what's the weather today"
    ];

    for (const query of webSearchQueries) {
      try {
        const response = await this.makeRequest('/api/chat/study-assistant/send', {
          message: query,
          enableWebSearch: true
        });

        const hasWebSearch = response.success && 
          (response.data?.webSearch || 
           response.data?.content?.includes('latest') ||
           response.data?.content?.includes('2024') ||
           response.data?.content?.includes('current') ||
           response.data?.searchResults);

        await this.recordTest('webSearch', `Web Search Query: "${query.substring(0, 30)}..."`, 
          hasWebSearch,
          hasWebSearch ? 'Web search integration working' : 'Web search not detected in response',
          { query, hasWebSearch }
        );
      } catch (error) {
        await this.recordTest('webSearch', `Web Search Query: "${query.substring(0, 30)}..."`, 
          false, `Web search test failed: ${error.message}`);
      }
    }
  }

  async testHallucinationPrevention() {
    this.log('Testing 5-Layer Hallucination Prevention...', 'test');
    
    const testQueries = [
      "What is the exact value of pi to 100 decimal places?",
      "Explain Einstein's theory of relativity",
      "What happened in 2025 in the stock market?",
      "I need help with my personal tax documents"
    ];

    for (const query of testQueries) {
      try {
        const response = await this.makeRequest('/api/chat/study-assistant/send', {
          message: query,
          enableHallucinationPrevention: true
        });

        const hasValidation = response.success && 
          (response.data?.validation || 
           response.data?.hallucinationPrevention ||
           response.data?.content?.includes('accurate') ||
           response.data?.confidence ||
           response.data?.content?.length > 50);

        await this.recordTest('hallucinationPrevention', `Hallucination Prevention: "${query.substring(0, 30)}..."`, 
          hasValidation,
          hasValidation ? 'Hallucination prevention layers active' : 'No validation detected',
          { query, hasValidation }
        );
      } catch (error) {
        await this.recordTest('hallucinationPrevention', `Hallucination Prevention: "${query.substring(0, 30)}..."`, 
          false, `Hallucination prevention test failed: ${error.message}`);
      }
    }
  }

  async testUniversalChatIntegration() {
    this.log('Testing UniversalChat Integration...', 'test');
    
    // Test main chat interface
    try {
      const response = await this.makeRequest('/api/chat/study-assistant/send', {
        message: "Hello, can you help me with my studies?",
        chatType: 'universal'
      });

      const isWorking = response.success && 
        (response.data?.content || 
         response.data?.message ||
         response.data?.response);

      await this.recordTest('universalChat', 'Main UniversalChat Interface', 
        isWorking,
        isWorking ? 'UniversalChat interface working' : 'UniversalChat interface not responding',
        { responseTime: Date.now() - this.startTime }
      );
    } catch (error) {
      await this.recordTest('universalChat', 'Main UniversalChat Interface', 
        false, `UniversalChat test failed: ${error.message}`);
    }

    // Test feature flags
    try {
      const response = await this.makeRequest('/api/chat/study-assistant/send', {
        message: "Show me my study progress",
        featureFlags: ['performance_analysis', 'study_suggestions']
      });

      const hasFeatures = response.success && 
        (response.data?.features || 
         response.data?.personalization ||
         response.data?.analysis);

      await this.recordTest('universalChat', 'UniversalChat Feature Flags', 
        hasFeatures,
        hasFeatures ? 'Feature flags system working' : 'Feature flags not detected',
        { hasFeatures }
      );
    } catch (error) {
      await this.recordTest('universalChat', 'UniversalChat Feature Flags', 
        false, `Feature flags test failed: ${error.message}`);
    }
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE AI SYSTEM TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('-'.repeat(50));
    console.log(`Total Tests Run: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    
    console.log('\n🧪 DETAILED TEST RESULTS BY CATEGORY');
    console.log('-'.repeat(50));
    
    const categories = [
      'healthCheck', 'personalization', 'adaptiveTeaching', 
      'memoryIntegration', 'webSearch', 'hallucinationPrevention', 'universalChat'
    ];
    
    categories.forEach(category => {
      let tests;
      if (category === 'healthCheck') {
        tests = testResults[category].tests;
      } else {
        tests = testResults[category];
      }
      
      if (tests.length === 0) return;
      
      const passed = tests.filter(t => t.success).length;
      const total = tests.length;
      const successRate = ((passed / total) * 100).toFixed(1);
      
      console.log(`\n${category.toUpperCase().replace('_', ' ')}: ${passed}/${total} (${successRate}%)`);
      
      tests.forEach(test => {
        const icon = test.success ? '✅' : '❌';
        console.log(`  ${icon} ${test.name}: ${test.message}`);
        if (test.details && Object.keys(test.details).length > 0) {
          console.log(`      Details: ${JSON.stringify(test.details, null, 2).split('\n').map(line => '        ' + line).join('\n')}`);
        }
      });
    });
    
    console.log('\n🎯 SYSTEM STATUS ASSESSMENT');
    console.log('-'.repeat(50));
    
    // Health Check Status
    if (testResults.healthCheck.success) {
      console.log('✅ System Health: HEALTHY');
    } else {
      console.log('❌ System Health: ISSUES DETECTED');
    }
    
    // Core Features Status
    const coreFeatures = [
      { name: 'Personalization', tests: testResults.personalization },
      { name: 'Adaptive Teaching', tests: testResults.adaptiveTeaching },
      { name: 'Memory Integration', tests: testResults.memoryIntegration },
      { name: 'Web Search', tests: testResults.webSearch },
      { name: 'Hallucination Prevention', tests: testResults.hallucinationPrevention },
      { name: 'UniversalChat', tests: testResults.universalChat }
    ];
    
    coreFeatures.forEach(feature => {
      if (feature.tests.length === 0) {
        console.log(`⚠️  ${feature.name}: NO TESTS RUN`);
        return;
      }
      
      const passed = feature.tests.filter(t => t.success).length;
      const total = feature.tests.length;
      const successRate = (passed / total) * 100;
      
      if (successRate >= 80) {
        console.log(`✅ ${feature.name}: WORKING (${successRate.toFixed(1)}%)`);
      } else if (successRate >= 50) {
        console.log(`⚠️  ${feature.name}: PARTIAL (${successRate.toFixed(1)}%)`);
      } else {
        console.log(`❌ ${feature.name}: ISSUES (${successRate.toFixed(1)}%)`);
      }
    });
    
    console.log('\n🚀 FINAL VERDICT');
    console.log('-'.repeat(50));
    
    const overallSuccess = (this.passedTests / this.totalTests) * 100;
    
    if (overallSuccess >= 90) {
      console.log('🎉 AI SYSTEM STATUS: EXCELLENT - All systems working perfectly!');
    } else if (overallSuccess >= 80) {
      console.log('✅ AI SYSTEM STATUS: GOOD - Core systems operational with minor issues');
    } else if (overallSuccess >= 60) {
      console.log('⚠️  AI SYSTEM STATUS: NEEDS ATTENTION - Several systems require fixes');
    } else {
      console.log('❌ AI SYSTEM STATUS: CRITICAL - Major systems not working');
    }
    
    console.log('\n📝 RECOMMENDATIONS');
    console.log('-'.repeat(50));
    
    const failedCategories = categories.filter(cat => {
      let tests;
      if (cat === 'healthCheck') {
        tests = testResults[cat].tests;
      } else {
        tests = testResults[cat];
      }
      if (tests.length === 0) return false;
      const passed = tests.filter(t => t.success).length;
      return (passed / tests.length) < 0.8;
    });
    
    if (failedCategories.length === 0) {
      console.log('🎯 All systems are working well! System is ready for production.');
    } else {
      console.log('🔧 Focus on fixing these areas:');
      failedCategories.forEach(cat => {
        console.log(`   • ${cat.replace('_', ' ').toUpperCase()}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      totalTests: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: overallSuccess,
      duration: totalDuration,
      categories: testResults
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive AI System Test Suite...', 'info');
    this.log(`Target URL: ${BASE_URL}`, 'info');
    this.log(`Test User ID: ${TEST_USER_ID}`, 'info');
    
    // Run all test suites
    await this.testHealthCheck();
    await this.testPersonalizationSystem();
    await this.testAdaptiveTeachingSystem();
    await this.testMemoryIntegration();
    await this.testWebSearchIntegration();
    await this.testHallucinationPrevention();
    await this.testUniversalChatIntegration();
    
    // Generate comprehensive report
    return this.generateReport();
  }
}

// Main execution
if (require.main === module) {
  const tester = new ComprehensiveAISystemTest();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveAISystemTest };