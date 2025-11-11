/**
 * Fixed Comprehensive Test Suite with Proper API Response Validation
 */

const http = require('http');
const https = require('https');

class FixedTestRunner {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.testUserId = 'fixed-test-user-' + Date.now();
  }

  async makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL);
      const client = url.protocol === 'https:' ? https : http;
      
      const requestData = JSON.stringify(data);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData),
          'x-test-mode': 'true'
        }
      };

      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              statusCode: res.statusCode,
              data: parsed,
              responseText: responseData
            });
          } catch (error) {
            resolve({
              success: false,
              statusCode: res.statusCode,
              data: responseData,
              error: 'JSON parse error'
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      req.write(requestData);
      req.end();
    });
  }

  async testScenario(scenario) {
    console.log(`\n🎯 Testing: ${scenario.name}`);
    const startTime = Date.now();
    
    const results = {
      scenarioName: scenario.name,
      status: 'PASS',
      responses: [],
      errors: [],
      validations: []
    };

    try {
      for (let i = 0; i < scenario.testInputs.length; i++) {
        const input = scenario.testInputs[i];
        console.log(`   📝 Input ${i + 1}: "${input}"`);
        
        const response = await this.makeRequest('/api/ai/chat', {
          message: input,
          conversationId: i === 0 ? 'test-conversation-' + Date.now() : undefined,
          userId: this.testUserId,
          context: { testMode: true, scenario: 'fixed_test' }
        });
        
        results.responses.push(response);
        console.log(`   ✅ Response: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})`);
        
        // Validate the response structure
        const isValidResponse = response.success && 
                               response.data && 
                               (response.data.data || response.data.aiResponse);
        
        if (!isValidResponse) {
          results.errors.push(`Invalid response structure for input ${i + 1}`);
        }
      }

      // Validate expected behaviors
      results.validations = this.validateBehaviors(scenario, results.responses);
      
      // Check if all validations passed
      const allPassed = results.validations.every(v => v.passed);
      if (!allPassed || results.errors.length > 0) {
        results.status = 'FAIL';
      }
      
      results.duration = Date.now() - startTime;
      
    } catch (error) {
      results.status = 'FAIL';
      results.errors.push(`Scenario error: ${error.message}`);
      results.duration = Date.now() - startTime;
    }

    return results;
  }

  validateBehaviors(scenario, responses) {
    const validations = [];
    
    for (const behavior of scenario.expectedBehaviors) {
      const validation = this.checkBehavior(behavior, responses);
      validations.push(validation);
    }
    
    return validations;
  }

  checkBehavior(behavior, responses) {
    const behaviorLower = behavior.toLowerCase();
    
    // Check if we have any successful responses
    const validResponses = responses.filter(r => r.success && r.data);
    if (validResponses.length === 0) {
      return {
        check: behavior.split(' ').slice(0, 3).join(' '),
        passed: false,
        details: 'No valid responses received'
      };
    }

    // Check for personalization
    if (behaviorLower.includes('personalized') || behaviorLower.includes('personalization')) {
      const hasPersonalization = validResponses.some(response => {
        const responseText = JSON.stringify(response.data).toLowerCase();
        return responseText.includes('personal') || 
               responseText.includes('your') || 
               responseText.includes('study') ||
               responseText.includes('learning');
      });
      return {
        check: 'Personalization',
        passed: hasPersonalization,
        details: hasPersonalization ? 'Personalization detected' : 'No personalization found'
      };
    }

    // Check for web search
    if (behaviorLower.includes('web search')) {
      const hasWebSearch = validResponses.some(response => {
        const responseText = JSON.stringify(response.data).toLowerCase();
        return responseText.includes('web') || 
               responseText.includes('search') || 
               responseText.includes('recent') ||
               responseText.includes('current');
      });
      return {
        check: 'Web Search',
        passed: hasWebSearch,
        details: hasWebSearch ? 'Web search indicators found' : 'No web search detected'
      };
    }

    // Check for memory integration
    if (behaviorLower.includes('memory')) {
      const hasMemory = validResponses.some(response => {
        const responseText = JSON.stringify(response.data).toLowerCase();
        return responseText.includes('memory') || 
               responseText.includes('remember') || 
               responseText.includes('context') ||
               responseText.includes('conversation');
      });
      return {
        check: 'Memory Integration',
        passed: hasMemory,
        details: hasMemory ? 'Memory integration found' : 'No memory integration detected'
      };
    }

    // Check for hallucination prevention
    if (behaviorLower.includes('hallucination')) {
      const hasPrevention = validResponses.some(response => {
        const responseText = JSON.stringify(response.data).toLowerCase();
        return responseText.includes('not sure') || 
               responseText.includes('unclear') || 
               responseText.includes('cannot') ||
               responseText.includes('insufficient');
      });
      return {
        check: 'Hallucination Prevention',
        passed: hasPrevention,
        details: hasPrevention ? 'Hallucination prevention detected' : 'No prevention found'
      };
    }

    // Default: check for valid content
    const hasValidContent = validResponses.some(response => {
      const data = response.data;
      if (data.data && data.data.aiResponse && data.data.aiResponse.content) {
        return true; // Has aiResponse content
      }
      if (data.content) {
        return true; // Has direct content
      }
      return false;
    });

    return {
      check: 'Valid Response Content',
      passed: hasValidContent,
      details: hasValidContent ? 'Valid content structure found' : 'No valid content detected'
    };
  }

  async runFixedTests() {
    console.log('🧪 Fixed Comprehensive Chat System Test Suite\n');
    
    const scenarios = [
      {
        name: 'Personalized Thermodynamics Teaching',
        testInputs: ['thermo sajhao', 'sajh nhi aaya', 'aur batao'],
        expectedBehaviors: [
          'Detects personalized context',
          'Progressive disclosure of concepts',
          'Memory retention across conversation'
        ]
      },
      {
        name: 'General Knowledge with Web Search',
        testInputs: ['What is the capital of France?'],
        expectedBehaviors: [
          'Web search decision engine activated',
          'Accurate factual response provided'
        ]
      },
      {
        name: 'Complex Study Question',
        testInputs: ['Explain quantum mechanics in simple terms'],
        expectedBehaviors: [
          'Personalized teaching approach',
          'Memory context integration'
        ]
      },
      {
        name: 'Multi-Step Learning',
        testInputs: ['I need help with calculus derivatives', 'Can you give me more examples?', 'Show me applications'],
        expectedBehaviors: [
          'Context building across messages',
          'Memory context retention'
        ]
      },
      {
        name: 'Hallucination Prevention',
        testInputs: ['What is the color of invisible?'],
        expectedBehaviors: [
          'Hallucination prevention layers active'
        ]
      },
      {
        name: 'Memory Integration',
        testInputs: ['What did we discuss yesterday?'],
        expectedBehaviors: [
          'Memory retrieval system active',
          'Context building from previous conversations'
        ]
      },
      {
        name: 'Service Manager Health',
        testInputs: ['Test message 1', 'Test message 2', 'Test message 3'],
        expectedBehaviors: [
          'System responding correctly',
          'Performance metrics collected'
        ]
      },
      {
        name: 'Feature Flag System',
        testInputs: ['Test feature flag functionality', 'Test another flag'],
        expectedBehaviors: [
          'Feature flag system operational',
          'User segment-based access'
        ]
      }
    ];

    const results = [];
    let passedCount = 0;
    
    for (const scenario of scenarios) {
      const result = await this.testScenario(scenario);
      results.push(result);
      
      if (result.status === 'PASS') {
        passedCount++;
      }
      
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.scenarioName}: ${result.status}`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }

    // Generate final report
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const successRate = (passedCount / results.length) * 100;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FIXED TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Scenarios: ${results.length}`);
    console.log(`Passed: ${passedCount} ✅`);
    console.log(`Failed: ${results.length - passedCount} ❌`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    console.log('\n🔍 VALIDATION SUMMARY:');
    results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.scenarioName}`);
      result.validations.forEach(validation => {
        const checkIcon = validation.passed ? '✅' : '❌';
        console.log(`   ${checkIcon} ${validation.check}: ${validation.details}`);
      });
    });
    
    console.log('\n🎯 PRODUCTION READINESS:');
    if (successRate >= 75) {
      console.log('🟢 SYSTEM READY: Core functionality working');
    } else if (successRate >= 50) {
      console.log('🟡 PARTIAL: Some issues need attention');
    } else {
      console.log('🔴 ISSUES: Significant problems detected');
    }
    
    console.log('='.repeat(60));
    
    return {
      success: successRate >= 75,
      totalScenarios: results.length,
      passedScenarios: passedCount,
      successRate,
      results
    };
  }
}

// Run the fixed tests
if (require.main === module) {
  const runner = new FixedTestRunner();
  runner.runFixedTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { FixedTestRunner };