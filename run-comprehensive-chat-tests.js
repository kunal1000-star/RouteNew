#!/usr/bin/env node

/**
 * Comprehensive Unified Chat System Test Runner
 * Executes all test scenarios and generates detailed reports
 * 
 * Usage: node run-comprehensive-chat-tests.js [options]
 * 
 * Options:
 *   --url <url>        Base URL for API calls (default: http://localhost:3000)
 *   --timeout <ms>     Request timeout in milliseconds (default: 30000)
 *   --verbose          Enable verbose output
 *   --report-format    Output format: json|html|text (default: text)
 *   --output <file>    Save report to file
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Test configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  verbose: false,
  reportFormat: 'text',
  outputFile: null,
  testUserId: 'comprehensive-test-user-' + Date.now(),
  maxRetries: 3,
  retryDelay: 1000
};

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i += 2) {
    const arg = args[i];
    const value = args[i + 1];
    
    switch (arg) {
      case '--url':
        CONFIG.baseURL = value;
        break;
      case '--timeout':
        CONFIG.timeout = parseInt(value);
        break;
      case '--verbose':
        CONFIG.verbose = true;
        i--; // No value for this flag
        break;
      case '--report-format':
        CONFIG.reportFormat = value;
        break;
      case '--output':
        CONFIG.outputFile = value;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
}

function printHelp() {
  console.log(`
Comprehensive Unified Chat System Test Runner
==============================================

Usage: node run-comprehensive-chat-tests.js [options]

Options:
  --url <url>        Base URL for API calls (default: http://localhost:3000)
  --timeout <ms>     Request timeout in milliseconds (default: 30000)
  --verbose          Enable verbose output
  --report-format    Output format: json|html|text (default: text)
  --output <file>    Save report to file
  --help             Show this help message

Examples:
  node run-comprehensive-chat-tests.js
  node run-comprehensive-chat-tests.js --url https://my-app.com
  node run-comprehensive-chat-tests.js --verbose --output test-report.json
  `);
}

// HTTP request helper with timeout
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Comprehensive-Chat-Test-Runner/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test scenarios data
function getTestScenarios() {
  return [
    {
      id: 'thermo-personalized',
      name: 'Personalized Thermodynamics Teaching',
      description: 'Tests adaptive teaching with progressive disclosure for thermodynamics',
      testInputs: [
        'thermo sajhao',
        'sajh nhi aaya', 
        'aur batao'
      ],
      expectedBehaviors: [
        'Detects personalized context (user studying thermodynamics)',
        'Progressive disclosure of concepts',
        'Adaptive response to confusion signals',
        'Memory retention across conversation'
      ],
      validationChecks: [
        'Personalization detection working',
        'Progressive teaching implemented',
        'Confusion handling effective',
        'Memory context maintained'
      ]
    },
    {
      id: 'web-search-knowledge',
      name: 'General Knowledge with Web Search',
      description: 'Tests web search integration for factual questions',
      testInputs: [
        'What is the capital of France?'
      ],
      expectedBehaviors: [
        'Web search decision engine activated',
        'Accurate factual response provided',
        'Sources referenced appropriately'
      ],
      validationChecks: [
        'Web search integration active',
        'Factual accuracy maintained',
        'Response includes verification'
      ]
    },
    {
      id: 'complex-study',
      name: 'Complex Study Question',
      description: 'Tests full system integration for complex educational queries',
      testInputs: [
        'Explain quantum mechanics in simple terms'
      ],
      expectedBehaviors: [
        'Personalized teaching approach',
        'Web search for latest information',
        'Memory context integration',
        'Hallucination prevention validation'
      ],
      validationChecks: [
        'Personalization engine active',
        'Web search decision made',
        'Memory retrieval working',
        'All 5 hallucination layers functioning'
      ]
    },
    {
      id: 'multi-step-learning',
      name: 'Multi-Step Learning Scenario',
      description: 'Tests progressive learning with memory context',
      testInputs: [
        'I need help with calculus derivatives',
        'Can you give me more examples?',
        'Show me applications'
      ],
      expectedBehaviors: [
        'Context building across messages',
        'Progressive complexity increase',
        'Memory context retention',
        'Adaptive response adjustment'
      ],
      validationChecks: [
        'Context building successful',
        'Progressive learning active',
        'Memory persistence verified',
        'Adaptation to user feedback'
      ]
    },
    {
      id: 'hallucination-prevention',
      name: 'Hallucination Prevention Validation',
      description: 'Tests all 5 hallucination prevention layers',
      testInputs: [
        'What is the color of invisible?'
      ],
      expectedBehaviors: [
        'Layer 1: Query classification detects invalid question',
        'Layer 2: Memory validation prevents false information',
        'Layer 3: Factual verification rejects invalid concept',
        'Layer 4: Personalization context awareness',
        'Layer 5: Real-time monitoring and alerts'
      ],
      validationChecks: [
        'Layer 1: Query classifier active',
        'Layer 2: Memory validator working',
        'Layer 3: Factual verification active',
        'Layer 4: Personalization engine functioning',
        'Layer 5: Real-time monitoring operational'
      ]
    },
    {
      id: 'memory-integration',
      name: 'Memory Integration Test',
      description: 'Tests cross-conversation memory retrieval and context',
      testInputs: [
        'What did we discuss yesterday?'
      ],
      expectedBehaviors: [
        'Memory retrieval system active',
        'Context building from previous conversations',
        'Semantic search for relevant memories',
        'Memory integration in response generation'
      ],
      validationChecks: [
        'Memory storage working',
        'Semantic search functional',
        'Context retrieval successful',
        'Memory integration complete'
      ]
    },
    {
      id: 'service-manager-health',
      name: 'Service Manager Health Check',
      description: 'Tests load balancing and provider fallback under load',
      testInputs: [
        'Simple test message 1',
        'Simple test message 2',
        'Simple test message 3',
        'Simple test message 4',
        'Simple test message 5'
      ],
      expectedBehaviors: [
        'Load balancing across providers',
        'Automatic fallback on provider failure',
        'Health monitoring active',
        'Performance metrics collected'
      ],
      validationChecks: [
        'Load balancing operational',
        'Fallback mechanism working',
        'Health checks passing',
        'Performance monitoring active'
      ]
    },
    {
      id: 'feature-flag-rollout',
      name: 'Feature Flag Progressive Rollout',
      description: 'Tests feature flag system with different user segments',
      testInputs: [
        'Enable test flag for this session',
        'Test flag-dependent functionality'
      ],
      expectedBehaviors: [
        'Feature flags properly configured',
        'User segment-based feature access',
        'Progressive rollout management',
        'Feature flag health monitoring'
      ],
      validationChecks: [
        'Feature flag system active',
        'User segment detection working',
        'Progressive rollout configured',
        'Health monitoring operational'
      ]
    }
  ];
}

// Core test execution functions
async function executeScenario(scenario) {
  console.log(`\n🎯 Testing: ${scenario.name}`);
  const startTime = Date.now();
  
  const result = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    status: 'FAIL',
    duration: 0,
    responses: [],
    errors: [],
    validations: []
  };

  try {
    for (let i = 0; i < scenario.testInputs.length; i++) {
      const input = scenario.testInputs[i];
      console.log(`   📝 Input ${i + 1}: "${input}"`);
      
      const response = await makeChatRequest(input, i === 0);
      result.responses.push(response);
      
      if (CONFIG.verbose) {
        console.log(`      ⏱️  Response time: ${response.duration}ms`);
        console.log(`      📊 Status: ${response.success ? 'Success' : 'Failed'}`);
      }
    }

    result.duration = Date.now() - startTime;
    result.validations = await validateScenario(scenario, result.responses);
    
    // Determine overall status
    const allValidationsPassed = result.validations.every(v => v.passed);
    result.status = allValidationsPassed ? 'PASS' : 'FAIL';
    
    if (!allValidationsPassed) {
      const failedValidations = result.validations.filter(v => !v.passed);
      result.errors = failedValidations.map(v => `${v.check}: ${v.details}`);
    }

  } catch (error) {
    result.errors.push(`Scenario execution failed: ${error.message}`);
    result.status = 'FAIL';
    result.duration = Date.now() - startTime;
  }

  return result;
}

async function makeChatRequest(message, isFirstRequest) {
  const startTime = Date.now();
  const conversationId = isFirstRequest ? 'test-conversation-' + Date.now() : undefined;
  
  const requestData = {
    message,
    conversationId,
    userId: CONFIG.testUserId,
    context: {
      testMode: true,
      scenario: 'comprehensive_test',
      timestamp: new Date().toISOString()
    },
    features: {
      enableMemory: true,
      enableWebSearch: true,
      enablePersonalization: true,
      enableHallucinationPrevention: true
    }
  };

  const requestOptions = {
    url: `${CONFIG.baseURL}/api/ai/chat`,
    method: 'POST',
    headers: {
      'x-test-mode': 'true'
    }
  };

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await makeRequest(requestOptions, requestData);
      const duration = Date.now() - startTime;
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          statusCode: response.statusCode,
          data: response.data,
          duration,
          request: requestData
        };
      } else {
        throw new Error(`HTTP ${response.statusCode}: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        return {
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
          request: requestData
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
}

async function validateScenario(scenario, responses) {
  const validations = [];
  
  for (const expectedBehavior of scenario.expectedBehaviors) {
    const validationResult = checkExpectedBehavior(expectedBehavior, responses);
    validations.push(validationResult);
  }
  
  return validations;
}

function checkExpectedBehavior(expectedBehavior, responses) {
  const allResponses = responses.map(r => r.data).filter(d => d);
  
  if (allResponses.length === 0) {
    return {
      check: expectedBehavior.split(' ').slice(0, 3).join(' '),
      passed: false,
      details: 'No valid responses received'
    };
  }

  const behaviorLower = expectedBehavior.toLowerCase();
  const responseText = JSON.stringify(allResponses).toLowerCase();
  
  // Check for specific behavior patterns
  if (behaviorLower.includes('personalized') || behaviorLower.includes('personalization')) {
    const hasPersonalization = responseText.includes('personal') || 
                              responseText.includes('your') || 
                              responseText.includes('your study') || 
                              responseText.includes('your learning');
    return {
      check: 'Personalization',
      passed: hasPersonalization,
      details: hasPersonalization ? 'Personalization detected' : 'No personalization found'
    };
  }
  
  if (behaviorLower.includes('web search')) {
    const hasWebSearch = responseText.includes('web') || 
                        responseText.includes('search') || 
                        responseText.includes('recent') || 
                        responseText.includes('current');
    return {
      check: 'Web Search',
      passed: hasWebSearch,
      details: hasWebSearch ? 'Web search indicators found' : 'No web search detected'
    };
  }
  
  if (behaviorLower.includes('memory')) {
    const hasMemory = responseText.includes('remember') || 
                     responseText.includes('previously') || 
                     responseText.includes('before') || 
                     responseText.includes('earlier');
    return {
      check: 'Memory Integration',
      passed: hasMemory,
      details: hasMemory ? 'Memory indicators found' : 'No memory integration detected'
    };
  }
  
  if (behaviorLower.includes('hallucination')) {
    const hasHallucinationPrevention = responseText.includes('not sure') || 
                                      responseText.includes('unclear') || 
                                      responseText.includes('cannot') || 
                                      responseText.includes('insufficient');
    return {
      check: 'Hallucination Prevention',
      passed: hasHallucinationPrevention,
      details: hasHallucinationPrevention ? 'Hallucination prevention active' : 'No prevention detected'
    };
  }
  
  // Default validation: check for valid response content
  const hasValidContent = allResponses.some(response => {
    return response && (response.content || response.message || response.text);
  });
  
  return {
    check: 'Valid Response',
    passed: hasValidContent,
    details: hasValidContent ? 'Valid response content found' : 'No valid content detected'
  };
}

// Report generation
function generateReport(results) {
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const passedScenarios = results.filter(r => r.status === 'PASS').length;
  const totalScenarios = results.length;
  const failedScenarios = results.filter(r => r.status === 'FAIL').length;
  const successRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0;

  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      baseURL: CONFIG.baseURL,
      timeout: CONFIG.timeout,
      testUserId: CONFIG.testUserId
    },
    summary: {
      totalScenarios,
      passedScenarios,
      failedScenarios,
      successRate: successRate.toFixed(1),
      totalDuration
    },
    scenarios: results
  };

  return report;
}

function printTextReport(results) {
  const report = generateReport(results);
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 COMPREHENSIVE UNIFIED CHAT SYSTEM TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 OVERALL RESULTS`);
  console.log(`   Test URL: ${CONFIG.baseURL}`);
  console.log(`   Total Scenarios: ${report.summary.totalScenarios}`);
  console.log(`   Passed: ${report.summary.passedScenarios} ✅`);
  console.log(`   Failed: ${report.summary.failedScenarios} ❌`);
  console.log(`   Success Rate: ${report.summary.successRate}%`);
  console.log(`   Total Duration: ${report.summary.totalDuration}ms`);

  console.log(`\n🔍 DETAILED SCENARIO RESULTS`);
  console.log('-'.repeat(80));
  
  results.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${statusIcon} ${result.scenarioName}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Validations:`);
    
    result.validations.forEach(validation => {
      const checkIcon = validation.passed ? '✅' : '❌';
      console.log(`     ${checkIcon} ${validation.check}`);
      console.log(`        → ${validation.details}`);
    });
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  });

  console.log(`\n🎯 PRODUCTION READINESS ASSESSMENT`);
  console.log('-'.repeat(60));
  
  const successRate = parseFloat(report.summary.successRate);
  if (successRate >= 90) {
    console.log('🟢 EXCELLENT: System is production-ready');
  } else if (successRate >= 75) {
    console.log('🟡 GOOD: System mostly ready with minor issues');
  } else if (successRate >= 50) {
    console.log('🟠 WARNING: System needs significant work');
  } else {
    console.log('🔴 CRITICAL: System not ready for production');
  }

  console.log('='.repeat(80));
}

function printJSONReport(results) {
  const report = generateReport(results);
  const jsonReport = JSON.stringify(report, null, 2);
  
  if (CONFIG.outputFile) {
    fs.writeFileSync(CONFIG.outputFile, jsonReport);
    console.log(`\n📄 Report saved to: ${CONFIG.outputFile}`);
  } else {
    console.log(jsonReport);
  }
}

// Main execution
async function main() {
  console.log('🧪 Comprehensive Unified Chat System Test Suite');
  console.log('================================================\n');
  
  parseArguments();
  
  console.log(`📋 Configuration:`);
  console.log(`   Base URL: ${CONFIG.baseURL}`);
  console.log(`   Timeout: ${CONFIG.timeout}ms`);
  console.log(`   Test User ID: ${CONFIG.testUserId}`);
  console.log(`   Verbose: ${CONFIG.verbose}`);
  console.log(`   Report Format: ${CONFIG.reportFormat}`);
  
  const scenarios = getTestScenarios();
  const results = [];
  const totalStartTime = Date.now();
  
  console.log(`\n🚀 Starting test execution for ${scenarios.length} scenarios...\n`);
  
  for (const scenario of scenarios) {
    const result = await executeScenario(scenario);
    results.push(result);
    
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.scenarioName} completed in ${result.duration}ms`);
  }
  
  const totalDuration = Date.now() - totalStartTime;
  console.log(`\n⏱️  Total execution time: ${totalDuration}ms`);
  
  // Generate and display report
  if (CONFIG.reportFormat === 'json') {
    printJSONReport(results);
  } else {
    printTextReport(results);
  }
  
  // Exit with appropriate code
  const successRate = (results.filter(r => r.status === 'PASS').length / results.length) * 100;
  process.exit(successRate >= 75 ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}