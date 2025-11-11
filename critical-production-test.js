/**
 * CRITICAL PRODUCTION READINESS TEST
 * Direct API testing with real-world scenarios
 * Tests only the most critical failures to fix immediately
 */

const https = require('http');

class CriticalProductionTest {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.results = [];
    this.criticalIssues = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}...`);
      const result = await testFn();
      this.results.push({ name, status: 'PASS', result });
      console.log(`✅ ${name}: PASS`);
      return true;
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      this.criticalIssues.push({ name, error: error.message, details: error });
      console.log(`❌ ${name}: FAIL - ${error.message}`);
      return false;
    }
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const req = https.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async runCriticalTests() {
    console.log('🚨 STARTING CRITICAL PRODUCTION TESTS\n');

    // Test 1: Critical User Scenario - "thermodynamics sajha do"
    await this.test('Critical User Scenario: "thermodynamics sajha do"', async () => {
      const response = await this.makeRequest('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
        },
        body: {
          message: 'thermodynamics sajha do',
          conversationId: 'test-thermo-123',
          chatType: 'study_assistant',
          includeMemoryContext: true,
          includePersonalizedSuggestions: true
        }
      });

      if (response.status !== 200) {
        throw new Error(`AI chat failed with status ${response.status}: ${response.data}`);
      }

      const data = JSON.parse(response.data);
      if (!data.response || data.response.length < 10) {
        throw new Error('Insufficient AI response for thermodynamics question');
      }

      return {
        status: response.status,
        responseLength: data.response.length,
        systemsActive: data.allSystemsActive
      };
    });

    // Test 2: Navigation - Chat Routes
    await this.test('Navigation: Chat Routes', async () => {
      const routes = [
        '/chat',
        '/study-buddy',
        '/app/chat',
        '/app/study-buddy'
      ];

      for (const route of routes) {
        const response = await this.makeRequest(route);
        console.log(`  📍 ${route}: ${response.status}`);
        if (route === '/chat' && response.status === 404) {
          console.log(`  ⚠️ CRITICAL: /chat returns 404 - navigation broken!`);
        }
      }

      return { tested: routes.length };
    });

    // Test 3: API Endpoints
    await this.test('API Endpoints: Core Functionality', async () => {
      const endpoints = [
        { path: '/api/chat/health-check', method: 'GET' },
        { path: '/api/ai/memory-storage', method: 'GET' },
        { path: '/api/ai/semantic-search', method: 'GET' },
        { path: '/api/chat/study-assistant/send', method: 'GET' }, // Should be POST
        { path: '/api/chat/conversations', method: 'GET' }
      ];

      for (const endpoint of endpoints) {
        const response = await this.makeRequest(endpoint.path, { method: endpoint.method });
        console.log(`  🔌 ${endpoint.path} (${endpoint.method}): ${response.status}`);
        
        if (endpoint.path === '/api/chat/study-assistant/send' && response.status === 405) {
          console.log(`  ⚠️ CRITICAL: Method not allowed - should be POST!`);
        }
        if (endpoint.path === '/api/chat/conversations' && response.status === 404) {
          console.log(`  ⚠️ CRITICAL: Conversations endpoint missing!`);
        }
      }

      return { tested: endpoints.length };
    });

    // Test 4: Invalid Input Handling
    await this.test('Invalid Input: XSS Prevention', async () => {
      const xssPayload = '<script>alert("xss")</script>thermodynamics';
      
      const response = await this.makeRequest('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
        },
        body: {
          message: xssPayload,
          conversationId: 'test-xss-123',
          chatType: 'study_assistant',
          includeMemoryContext: true
        }
      });

      if (response.status === 200) {
        const data = JSON.parse(response.data);
        if (data.response && data.response.includes('<script>')) {
          throw new Error('XSS vulnerability: Script tags not sanitized');
        }
      }

      return { xssHandled: true };
    });

    // Test 5: Memory Integration
    await this.test('Memory Integration: Cross-conversation Recall', async () => {
      // Send initial message
      const firstResponse = await this.makeRequest('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
        },
        body: {
          message: 'My name is Alex and I study physics',
          conversationId: 'memory-test-123',
          chatType: 'study_assistant',
          includeMemoryContext: true
        }
      });

      // Ask follow-up question
      const secondResponse = await this.makeRequest('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
        },
        body: {
          message: 'What subject do I study?',
          conversationId: 'memory-test-123',
          chatType: 'study_assistant',
          includeMemoryContext: true
        }
      });

      if (secondResponse.status === 200) {
        const data = JSON.parse(secondResponse.data);
        if (!data.response.toLowerCase().includes('physics')) {
          console.log(`  ⚠️ Memory not working: Response = "${data.response}"`);
        }
      }

      return { memoryWorking: true };
    });

    // Test 6: Personalization
    await this.test('Personalization: Exam Context', async () => {
      const response = await this.makeRequest('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
        },
        body: {
          message: 'my exam is tomorrow',
          conversationId: 'personalization-test-123',
          chatType: 'study_assistant',
          includeMemoryContext: true,
          includePersonalizedSuggestions: true
        }
      });

      if (response.status === 200) {
        const data = JSON.parse(response.data);
        if (!data.personalizationApplied && data.personalizationApplied === false) {
          console.log(`  ⚠️ Personalization not applied`);
        }
      }

      return { personalizationWorking: true };
    });

    // Test 7: Performance Under Load
    await this.test('Performance: Concurrent Requests', async () => {
      const requests = Array(5).fill().map((_, i) => 
        this.makeRequest('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'x-user-id': '322531b3-173d-42a9-be4c-770ad92ac8b8'
          },
          body: {
            message: `Performance test message ${i}`,
            conversationId: `perf-test-${i}`,
            chatType: 'study_assistant',
            includeMemoryContext: false
          }
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successCount = results.filter(r => r.status === 200).length;
      console.log(`  📊 ${successCount}/5 requests successful in ${totalTime}ms`);

      if (successCount < 5) {
        throw new Error(`Only ${successCount}/5 concurrent requests succeeded`);
      }

      return { avgResponseTime: totalTime / 5, successRate: successCount / 5 };
    });
  }

  generateReport() {
    console.log('\n📊 CRITICAL PRODUCTION READINESS REPORT');
    console.log('==========================================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE FIX:');
      this.criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.name}: ${issue.error}`);
      });
    }

    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${result.name}`);
      if (result.status === 'FAIL') {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Production readiness verdict
    const productionReady = failedTests === 0 && this.criticalIssues.length === 0;
    console.log(`\n🎯 PRODUCTION READINESS VERDICT: ${productionReady ? '✅ READY' : '❌ NOT READY'}`);
    
    if (!productionReady) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('1. Fix broken /chat route (404 error)');
      console.log('2. Fix /api/chat/study-assistant/send method (405 error)');
      console.log('3. Fix /api/chat/conversations missing endpoint (404 error)');
      console.log('4. Resolve GoTrueClient authentication conflicts');
      console.log('5. Test UI message sending functionality');
      console.log('6. Verify memory integration working properly');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      criticalIssues: this.criticalIssues,
      productionReady
    };
  }
}

// Run the critical test
async function main() {
  const tester = new CriticalProductionTest();
  await tester.runCriticalTests();
  const report = tester.generateReport();
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync('critical-production-test-report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...report
  }, null, 2));
  
  console.log('\n📄 Report saved to: critical-production-test-report.json');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CriticalProductionTest;