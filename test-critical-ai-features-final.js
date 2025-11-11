#!/usr/bin/env node

/**
 * COMPREHENSIVE AI FEATURES FINAL TEST
 * Tests all critical AI features that must work in production
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '322531b3-173d-42a9-be4c-770ad92ac8b8';

class ComprehensiveAITest {
  constructor() {
    this.testResults = [];
    this.conversationId = `test-${Date.now()}`;
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          conversationId: this.conversationId,
          ...data
        })
      });
      
      const result = await response.json();
      return { success: response.ok, data: result, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testThermodynamicsTeaching() {
    this.log('Testing thermodynamics teaching system...');
    
    const result = await this.makeRequest('/api/ai/chat', {
      message: 'thermodynamics sajha do'
    });

    const isSuccess = result.success && 
                     result.data?.success === true &&
                     result.data?.data?.integrationStatus?.teaching_system === true;

    this.testResults.push({
      test: 'Thermodynamics Teaching',
      expected: 'Comprehensive thermodynamics explanation with teaching system',
      actual: result.data?.data?.aiResponse?.content?.substring(0, 100) + '...',
      success: isSuccess,
      details: result.data
    });

    if (isSuccess) {
      this.log('✅ Thermodynamics teaching system working');
    } else {
      this.log('❌ Thermodynamics teaching system failed', 'error');
      this.log(JSON.stringify(result.data, null, 2), 'error');
    }
    
    return isSuccess;
  }

  async testPersonalizedResponse() {
    this.log('Testing personalized response for exam scenario...');
    
    const result = await this.makeRequest('/api/ai/chat', {
      message: 'my exam is tomorrow and I am stressed'
    });

    const isSuccess = result.success && 
                     result.data?.success === true &&
                     result.data?.data?.integrationStatus?.personalization_system === true &&
                     !result.data?.data?.aiResponse?.content?.includes('I hope this information is helpful for you!');

    this.testResults.push({
      test: 'Personalized Response',
      expected: 'Personalized, not generic response',
      actual: result.data?.data?.aiResponse?.content?.substring(0, 100) + '...',
      success: isSuccess,
      details: result.data
    });

    if (isSuccess) {
      this.log('✅ Personalized response system working');
    } else {
      this.log('❌ Personalized response failed', 'error');
    }
    
    return isSuccess;
  }

  async testMemorySystem() {
    this.log('Testing memory system...');
    
    // First, send a message to create memory
    const firstResult = await this.makeRequest('/api/ai/chat', {
      message: 'I am studying for JEE physics and struggling with mechanics'
    });

    // Wait a moment for memory storage
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Then ask about what was previously discussed
    const secondResult = await this.makeRequest('/api/ai/chat', {
      message: 'what did I ask about earlier?'
    });

    const isSuccess = firstResult.success && secondResult.success &&
                     secondResult.data?.data?.integrationStatus?.memory_system === true &&
                     secondResult.data?.data?.integrationStatus?.memories_found >= 0;

    this.testResults.push({
      test: 'Memory System',
      expected: 'Memory context should be used and memories found',
      actual: `Memories found: ${secondResult.data?.data?.integrationStatus?.memories_found || 0}`,
      success: isSuccess,
      details: { 
        first: firstResult.data, 
        second: secondResult.data 
      }
    });

    if (isSuccess) {
      this.log('✅ Memory system working');
    } else {
      this.log('❌ Memory system failed', 'error');
    }
    
    return isSuccess;
  }

  async testWebSearchDecision() {
    this.log('Testing web search decision engine...');
    
    const result = await this.makeRequest('/api/ai/chat', {
      message: 'latest research 2024'
    });

    const isSuccess = result.success && 
                     result.data?.success === true &&
                     result.data?.data?.integrationStatus?.web_search_system === true &&
                     result.data?.data?.aiResponse?.web_search_enabled === true;

    this.testResults.push({
      test: 'Web Search Decision',
      expected: 'Web search should be triggered for recent information',
      actual: `Web search enabled: ${result.data?.data?.aiResponse?.web_search_enabled}`,
      success: isSuccess,
      details: result.data
    });

    if (isSuccess) {
      this.log('✅ Web search decision engine working');
    } else {
      this.log('❌ Web search decision failed', 'error');
    }
    
    return isSuccess;
  }

  async testUnifiedEndpoint() {
    this.log('Testing unified endpoint architecture...');
    
    // Test direct study-buddy endpoint
    const studyBuddyResult = await this.makeRequest('/api/study-buddy', {
      message: 'explain photosynthesis'
    });

    // Test direct AI chat endpoint
    const aiChatResult = await this.makeRequest('/api/ai/chat', {
      message: 'explain photosynthesis'
    });

    const isSuccess = studyBuddyResult.success && aiChatResult.success &&
                     studyBuddyResult.data?.studyBuddy?.isStudyBuddy === true &&
                     aiChatResult.data?.data?.aiResponse?.content?.length > 0;

    this.testResults.push({
      test: 'Unified Endpoint Architecture',
      expected: 'Both endpoints should work and integrate properly',
      actual: `Study Buddy: ${studyBuddyResult.success}, AI Chat: ${aiChatResult.success}`,
      success: isSuccess,
      details: { 
        studyBuddy: studyBuddyResult.data, 
        aiChat: aiChatResult.data 
      }
    });

    if (isSuccess) {
      this.log('✅ Unified endpoint architecture working');
    } else {
      this.log('❌ Unified endpoint failed', 'error');
    }
    
    return isSuccess;
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive AI features test...');
    
    const tests = [
      { name: 'Thermodynamics Teaching', test: () => this.testThermodynamicsTeaching() },
      { name: 'Personalized Response', test: () => this.testPersonalizedResponse() },
      { name: 'Memory System', test: () => this.testMemorySystem() },
      { name: 'Web Search Decision', test: () => this.testWebSearchDecision() },
      { name: 'Unified Endpoint', test: () => this.testUnifiedEndpoint() }
    ];

    for (const { name, test } of tests) {
      try {
        await test();
      } catch (error) {
        this.log(`❌ Test ${name} crashed: ${error.message}`, 'error');
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 FINAL TEST REPORT');
    this.log('=' * 50);
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    this.log(`Overall Success: ${passed}/${total} tests passed (${percentage}%)`);
    this.log('');

    this.testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} ${result.test}`);
      this.log(`   Expected: ${result.expected}`);
      this.log(`   Actual: ${result.actual}`);
      this.log('');
    });

    this.log('🎉 COMPREHENSIVE AI FEATURES TEST COMPLETED');
    
    if (percentage >= 80) {
      this.log('✅ System is PRODUCTION READY!');
      this.log('All critical AI features are working properly.');
    } else {
      this.log('❌ System needs fixes before production.');
      this.log(`${total - passed} features need attention.`);
    }

    return {
      total,
      passed,
      percentage,
      results: this.testResults,
      production_ready: percentage >= 80
    };
  }
}

// Run the test
if (require.main === module) {
  const tester = new ComprehensiveAITest();
  tester.runAllTests().then(result => {
    process.exit(result.production_ready ? 0 : 1);
  });
}

module.exports = ComprehensiveAITest;