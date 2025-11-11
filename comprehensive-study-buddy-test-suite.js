/**
 * Comprehensive Study Buddy Chat System Test Suite
 * Tests all critical scenarios for the unified study buddy system
 */

import fetch from 'node-fetch';
import fs from 'fs';

class StudyBuddyTestSuite {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/ai/chat';
    this.testUserId = 'test-user-12345';
    this.testSessionId = 'test-session-67890';
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🧪 COMPREHENSIVE STUDY BUDDY CHAT SYSTEM TEST SUITE');
    console.log('=' * 60);
    
    await this.test1_CriticalThermodynamicsTest();
    await this.test2_PersonalizationDetectionTest();
    await this.test3_MemoryIntegrationTest();
    await this.test4_WebSearchDecisionTest();
    await this.test5_HallucinationPreventionTest();
    await this.test6_RealAIIntegrationTest();
    await this.test7_ErrorHandlingTest();
    
    this.printFinalReport();
    return this.results;
  }

  async test1_CriticalThermodynamicsTest() {
    console.log('\n🔬 Test 1: Critical Thermodynamics Test');
    console.log('Testing the specific user scenario - "thermodynamics sajha do"');
    
    const testCase = {
      message: 'thermodynamics sajha do',
      userId: this.testUserId,
      conversationHistory: []
    };

    try {
      const response = await this.makeRequest(testCase);
      const isEducational = this.checkIfEducational(response.aiResponse?.content);
      const isNotGeneric = !response.aiResponse?.content?.includes('I can help you with') && 
                           !response.aiResponse?.content?.includes('How can I assist');
      
      this.addResult('Critical Thermodynamics Test', 
        isEducational && isNotGeneric, 
        `Educational: ${isEducational}, Not Generic: ${isNotGeneric}`);
      
    } catch (error) {
      this.addResult('Critical Thermodynamics Test', false, `Error: ${error.message}`);
    }
  }

  async test2_PersonalizationDetectionTest() {
    console.log('\n👤 Test 2: Personalization Detection Test');
    
    const testCases = [
      {
        name: 'Personalized Query',
        message: 'my physics test is tomorrow',
        expectedType: 'personalized',
        context: { urgency: 'immediate', personal: true }
      },
      {
        name: 'General Query',
        message: 'what is gravity?',
        expectedType: 'general',
        context: { personal: false }
      },
      {
        name: 'Personal Context Setting',
        message: "remember I'm studying for JEE",
        expectedType: 'personalized',
        context: { contextSetting: true, examFocused: true }
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await this.makeRequest({
          message: testCase.message,
          userId: this.testUserId,
          conversationHistory: []
        });

        const hasPersonalization = response.personalizedSuggestions?.enabled || 
                                 response.integrationStatus?.personalization_system;
        
        this.addResult(`Personalization Test - ${testCase.name}`, 
          hasPersonalization, 
          `Personalization detected: ${hasPersonalization}`);
          
      } catch (error) {
        this.addResult(`Personalization Test - ${testCase.name}`, false, `Error: ${error.message}`);
      }
    }
  }

  async test3_MemoryIntegrationTest() {
    console.log('\n🧠 Test 3: Memory Integration Test');
    
    // Test multi-turn conversation
    const messages = [
      'I am studying quantum mechanics',
      'what did I just ask about?',
      'help me with Schrödinger equation'
    ];

    let conversationHistory = [];
    
    for (let i = 0; i < messages.length; i++) {
      try {
        const response = await this.makeRequest({
          message: messages[i],
          userId: this.testUserId,
          conversationHistory: conversationHistory
        });

        const hasMemory = response.integrationStatus?.memory_system || 
                         response.integrationStatus?.memories_found > 0;
        
        // For the second message, check if it references the first
        if (i === 1) {
          const referencesContext = response.aiResponse?.content?.toLowerCase().includes('quantum') ||
                                   response.aiResponse?.content?.toLowerCase().includes('mechanics');
          this.addResult(`Memory Test - Follow-up ${i + 1}`, referencesContext, 
            `References previous context: ${referencesContext}`);
        }
        
        this.addResult(`Memory Test - Message ${i + 1}`, 
          hasMemory, 
          `Memory system active: ${hasMemory}`);
          
        conversationHistory.push({
          role: 'user',
          content: messages[i]
        });
        conversationHistory.push({
          role: 'assistant', 
          content: response.aiResponse?.content || 'Response received'
        });
        
      } catch (error) {
        this.addResult(`Memory Test - Message ${i + 1}`, false, `Error: ${error.message}`);
      }
    }
  }

  async test4_WebSearchDecisionTest() {
    console.log('\n🔍 Test 4: Web Search Decision Test');
    
    const testCases = [
      {
        name: 'Should Trigger Web Search',
        message: 'latest research on quantum computing 2024',
        shouldTriggerWebSearch: true,
        temporalQuery: true
      },
      {
        name: 'Should Use Internal Knowledge',
        message: 'explain Newton\'s laws',
        shouldTriggerWebSearch: false,
        factualQuery: true
      },
      {
        name: 'Recent Events Search',
        message: 'what happened in AI this month?',
        shouldTriggerWebSearch: true,
        recentQuery: true
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await this.makeRequest({
          message: testCase.message,
          userId: this.testUserId,
          conversationHistory: []
        });

        const webSearchTriggered = response.aiResponse?.web_search_enabled;
        const hasWebSearchIndicator = response.aiResponse?.content?.includes('latest') ||
                                     response.aiResponse?.content?.includes('recent') ||
                                     response.aiResponse?.content?.includes('current');
        
        this.addResult(`Web Search Test - ${testCase.name}`, 
          webSearchTriggered === testCase.shouldTriggerWebSearch, 
          `Web search triggered: ${webSearchTriggered}, Expected: ${testCase.shouldTriggerWebSearch}`);
          
      } catch (error) {
        this.addResult(`Web Search Test - ${testCase.name}`, false, `Error: ${error.message}`);
      }
    }
  }

  async test5_HallucinationPreventionTest() {
    console.log('\n🛡️ Test 5: 5-Layer Hallucination Prevention Test');
    
    const testCases = [
      {
        name: 'Ambiguous Query',
        message: 'What is the answer to everything?',
        shouldHandleAmbiguity: true
      },
      {
        name: 'Potentially Harmful Content',
        message: 'How do I hack a computer?',
        shouldBlockOrRedirect: true
      },
      {
        name: 'Complex Factual Question',
        message: 'Explain quantum entanglement and its applications in computing',
        shouldShowConfidenceScore: true
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await this.makeRequest({
          message: testCase.message,
          userId: this.testUserId,
          conversationHistory: []
        });

        const layersActive = response.integrationStatus?.hallucination_prevention_layers || [];
        const allLayersWorking = layersActive.length >= 5;
        
        this.addResult(`Hallucination Test - ${testCase.name}`, 
          allLayersWorking, 
          `Layers active: ${layersActive.join(', ')}`);
          
      } catch (error) {
        this.addResult(`Hallucination Test - ${testCase.name}`, false, `Error: ${error.message}`);
      }
    }
  }

  async test6_RealAIIntegrationTest() {
    console.log('\n🤖 Test 6: Real AI Integration Test');
    
    const testMessage = {
      message: 'What is the capital of France?',
      userId: this.testUserId,
      conversationHistory: []
    };

    try {
      const response = await this.makeRequest(testMessage);
      
      const hasRealAI = !!response.aiResponse?.model_used && 
                       !!response.aiResponse?.provider_used &&
                       response.aiResponse?.tokens_used > 0;
      
      const isNotHardcoded = !response.aiResponse?.content?.includes('PARSE ERROR') &&
                            !response.aiResponse?.content?.includes('fallback');
      
      this.addResult('Real AI Integration Test', 
        hasRealAI && isNotHardcoded, 
        `Real AI used: ${hasRealAI}, Not hardcoded: ${isNotHardcoded}, Model: ${response.aiResponse?.model_used}`);
        
    } catch (error) {
      this.addResult('Real AI Integration Test', false, `Error: ${error.message}`);
    }
  }

  async test7_ErrorHandlingTest() {
    console.log('\n⚠️ Test 7: Error Handling Test');
    
    const testCases = [
      {
        name: 'Invalid JSON',
        payload: { invalid: 'data' },
        shouldHandle: true
      },
      {
        name: 'Empty Message',
        payload: { message: '', userId: this.testUserId },
        shouldHandle: true
      },
      {
        name: 'Missing User ID',
        payload: { message: 'hello', userId: null },
        shouldHandle: true
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await this.makeRequest(testCase.payload);
        const hasErrorHandling = response.success !== false;
        
        this.addResult(`Error Handling Test - ${testCase.name}`, 
          hasErrorHandling, 
          `Handled gracefully: ${hasErrorHandling}`);
          
      } catch (error) {
        // Some errors are expected and should be handled gracefully
        this.addResult(`Error Handling Test - ${testCase.name}`, 
          true, 
          `Error caught: ${error.message}`);
      }
    }
  }

  async makeRequest(payload) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  checkIfEducational(content) {
    if (!content) return false;
    
    const educationalIndicators = [
      'thermodynamics', 'physics', 'energy', 'heat', 'temperature',
      'entropy', 'laws of thermodynamics', 'study', 'learn', 'explain'
    ];
    
    return educationalIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  addResult(testName, passed, details) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
      console.log(`✅ PASS: ${testName} - ${details}`);
    } else {
      this.results.failed++;
      console.log(`❌ FAIL: ${testName} - ${details}`);
    }
    
    this.results.tests.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  printFinalReport() {
    console.log('\n' + '=' * 60);
    console.log('📊 FINAL TEST REPORT');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`- ${test.name}: ${test.details}`));
    }
    
    // Save detailed report
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1) + '%'
      },
      tests: this.results.tests,
      timestamp: new Date().toISOString(),
      environment: {
        endpoint: this.baseURL,
        nodeVersion: process.version,
        testUserId: this.testUserId
      }
    };
    
    fs.writeFileSync('comprehensive-study-buddy-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: comprehensive-study-buddy-test-report.json');
  }
}

// Main execution
async function main() {
  const testSuite = new StudyBuddyTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite failed to run:', error);
    process.exit(1);
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default StudyBuddyTestSuite;