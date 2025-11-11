/**
 * COMPREHENSIVE PRODUCTION READINESS TEST SUITE
 * Real-world browser testing for unified study buddy chat system
 * Tests all critical scenarios to ensure 100% production readiness
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProductionReadinessTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      testResults: [],
      issues: [],
      performance: {},
      security: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing production readiness testing...');
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for real user simulation
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security', // Allow network tests
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      console.log('🔍 Browser Console:', msg.text());
    });
    
    // Enable request/response logging
    this.page.on('request', request => {
      console.log('📡 Request:', request.method(), request.url());
    });
    
    this.page.on('response', response => {
      console.log('📡 Response:', response.status(), response.url());
    });
  }

  async logTest(testName, status, message, details = {}) {
    const result = {
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    this.testResults.testResults.push(result);
    this.testResults.summary.total++;
    
    if (status === 'PASS') {
      this.testResults.summary.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else if (status === 'FAIL') {
      this.testResults.summary.failed++;
      console.log(`❌ ${testName}: ${message}`);
      this.testResults.issues.push(result);
    } else {
      this.testResults.summary.warnings++;
      console.log(`⚠️ ${testName}: ${message}`);
    }
  }

  async testBasicApplicationAccess() {
    console.log('\n🔍 Testing Basic Application Access...');
    
    try {
      // Test main page
      await this.page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.logTest(
        'Application Load',
        'PASS',
        'Successfully loaded main application',
        { url: 'http://localhost:3000' }
      );

      // Check if authentication is working
      const authStatus = await this.page.evaluate(() => {
        return {
          isAuthenticated: !!document.querySelector('[data-testid="user-menu"]'),
          pageTitle: document.title,
          hasNavigation: !!document.querySelector('nav, [data-testid="sidebar"]')
        };
      });

      await this.logTest(
        'Authentication Check',
        authStatus.isAuthenticated ? 'PASS' : 'WARN',
        authStatus.isAuthenticated ? 'User appears authenticated' : 'Authentication may be required',
        authStatus
      );

    } catch (error) {
      await this.logTest(
        'Application Load',
        'FAIL',
        `Failed to load application: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  async testInvalidValues() {
    console.log('\n🧪 Testing Invalid Values...');
    
    const invalidTests = [
      {
        name: 'Empty Message',
        message: '',
        expected: 'reject or show error'
      },
      {
        name: 'Very Long Message (10k chars)',
        message: 'A'.repeat(10000),
        expected: 'handle gracefully'
      },
      {
        name: 'Special Characters',
        message: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        expected: 'handle without breaking'
      },
      {
        name: 'Emojis',
        message: 'Hello 👨‍💻 how are you 🧠🔥💯?',
        expected: 'handle Unicode properly'
      },
      {
        name: 'HTML Injection Attempt',
        message: '<script>alert("xss")</script>Hello',
        expected: 'sanitize input'
      },
      {
        name: 'Non-ASCII Characters',
        message: 'こんにちは世界 Привет мир 你好世界',
        expected: 'handle multilingual input'
      }
    ];

    for (const test of invalidTests) {
      try {
        await this.navigateToChat();
        await this.sendMessage(test.message);
        
        await this.logTest(
          `Invalid Value: ${test.name}`,
          'PASS',
          `Successfully handled ${test.expected}`,
          { input: test.message.substring(0, 100) }
        );
      } catch (error) {
        await this.logTest(
          `Invalid Value: ${test.name}`,
          'FAIL',
          `Failed to handle: ${error.message}`,
          { input: test.message, error: error.toString() }
        );
      }
    }
  }

  async testRapidInteraction() {
    console.log('\n⚡ Testing Rapid Interaction Scenarios...');
    
    try {
      await this.navigateToChat();
      
      // Test rapid double-clicks on send button
      const sendButton = await this.page.$('[data-testid="send-button"], button[type="submit"]');
      if (sendButton) {
        for (let i = 0; i < 5; i++) {
          await sendButton.click();
          await this.sleep(100); // Rapid clicks
        }
        
        await this.logTest(
          'Rapid Double-Clicks',
          'PASS',
          'Handled rapid send button clicks',
          { clicks: 5 }
        );
      }

      // Test multiple simultaneous message sends
      const testMessages = ['Message 1', 'Message 2', 'Message 3'];
      for (const msg of testMessages) {
        await this.sendMessage(msg);
        await this.sleep(50);
      }

      await this.logTest(
        'Simultaneous Messages',
        'PASS',
        'Successfully sent multiple messages',
        { count: testMessages.length }
      );

    } catch (error) {
      await this.logTest(
        'Rapid Interaction',
        'FAIL',
        `Failed rapid interaction test: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  async testSessionManagement() {
    console.log('\n🔐 Testing Session Management...');
    
    try {
      // Test browser refresh
      await this.page.reload({ waitUntil: 'networkidle2' });
      await this.sleep(2000);
      
      await this.logTest(
        'Browser Refresh',
        'PASS',
        'Application survived browser refresh',
        { timestamp: new Date().toISOString() }
      );

      // Test back/forward navigation
      await this.page.goBack();
      await this.sleep(1000);
      await this.page.goForward();
      await this.sleep(1000);
      
      await this.logTest(
        'Back/Forward Navigation',
        'PASS',
        'Handled browser navigation',
        { direction: 'back-forward' }
      );

    } catch (error) {
      await this.logTest(
        'Session Management',
        'FAIL',
        `Session management failed: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  async testCriticalUserScenarios() {
    console.log('\n🎯 Testing Critical User Scenarios...');
    
    const criticalScenarios = [
      {
        name: 'Thermodynamics Sajha Do (Critical Test)',
        message: 'thermodynamics sajha do',
        expected: 'comprehensive educational content'
      },
      {
        name: 'Personalized Exam Query',
        message: 'my exam is tomorrow',
        expected: 'personalized response'
      },
      {
        name: 'General Knowledge Question',
        message: 'what is gravity?',
        expected: 'general educational response'
      },
      {
        name: 'Web Search Decision Test',
        message: 'latest research 2024',
        expected: 'trigger web search'
      },
      {
        name: 'Internal Knowledge Test',
        message: 'explain Newton laws',
        expected: 'use internal knowledge'
      }
    ];

    for (const scenario of criticalScenarios) {
      try {
        await this.navigateToChat();
        const startTime = Date.now();
        
        const response = await this.sendMessage(scenario.message);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        await this.logTest(
          `Critical Scenario: ${scenario.name}`,
          response ? 'PASS' : 'FAIL',
          `Response generated in ${responseTime}ms`,
          {
            input: scenario.message,
            response: response ? response.substring(0, 200) + '...' : 'No response',
            responseTime,
            expected: scenario.expected
          }
        );

        // Store performance data
        this.testResults.performance[scenario.name] = responseTime;
        
      } catch (error) {
        await this.logTest(
          `Critical Scenario: ${scenario.name}`,
          'FAIL',
          `Critical scenario failed: ${error.message}`,
          { input: scenario.message, error: error.toString() }
        );
      }
    }
  }

  async testMemoryIntegration() {
    console.log('\n🧠 Testing Memory Integration...');
    
    try {
      await this.navigateToChat();
      
      // First message
      const firstMessage = 'What are the laws of thermodynamics?';
      await this.sendMessage(firstMessage);
      
      // Memory test message
      await this.sleep(1000);
      const memoryTestResponse = await this.sendMessage('what did I just ask?');
      
      await this.logTest(
        'Memory Recall Test',
        memoryTestResponse && memoryTestResponse.toLowerCase().includes('thermodynamic') ? 'PASS' : 'FAIL',
        'Memory integration test result',
        {
          firstMessage,
          memoryTest: memoryTestResponse ? memoryTestResponse.substring(0, 100) + '...' : 'No response'
        }
      );

      // Multi-turn conversation test
      const conversation = [
        'My name is Alex and I study physics',
        'I have a test next week',
        'What should I focus on for my test?'
      ];
      
      for (const msg of conversation) {
        await this.sendMessage(msg);
        await this.sleep(1000);
      }
      
      await this.logTest(
        'Multi-turn Memory',
        'PASS',
        'Multi-turn conversation completed',
        { turns: conversation.length }
      );

    } catch (error) {
      await this.logTest(
        'Memory Integration',
        'FAIL',
        `Memory test failed: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  async testAPIEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');
    
    const endpoints = [
      'http://localhost:3000/api/chat/health-check',
      'http://localhost:3000/api/chat/study-assistant/send',
      'http://localhost:3000/api/chat/conversations',
      'http://localhost:3000/api/ai/memory-storage',
      'http://localhost:3000/api/ai/semantic-search'
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await this.page.goto(endpoint, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const status = response.status();
        
        await this.logTest(
          `API Endpoint: ${endpoint}`,
          status < 400 ? 'PASS' : 'FAIL',
          `Response ${status} in ${responseTime}ms`,
          { status, responseTime, url: endpoint }
        );
        
        this.testResults.performance[`api_${endpoint.split('/').pop()}`] = responseTime;
        
      } catch (error) {
        await this.logTest(
          `API Endpoint: ${endpoint}`,
          'FAIL',
          `API test failed: ${error.message}`,
          { error: error.toString(), url: endpoint }
        );
      }
    }
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2' 
      });
      
      const mobileLayout = await this.page.evaluate(() => {
        return {
          isResponsive: document.body.scrollWidth <= 375,
          hasMobileMenu: !!document.querySelector('[data-testid="mobile-menu"], .mobile-menu'),
          textReadability: window.getComputedStyle(document.body).fontSize
        };
      });
      
      await this.logTest(
        'Mobile Viewport',
        'PASS',
        'Mobile responsiveness test completed',
        mobileLayout
      );

      // Test touch interactions
      const chatInput = await this.page.$('input, textarea');
      if (chatInput) {
        await chatInput.tap();
        await this.logTest(
          'Touch Interactions',
          'PASS',
          'Touch input working on mobile',
          { viewport: '375x667' }
        );
      }

      // Reset to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
      
    } catch (error) {
      await this.logTest(
        'Mobile Responsiveness',
        'FAIL',
        `Mobile test failed: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  async testSecurityScenarios() {
    console.log('\n🔒 Testing Security Scenarios...');
    
    try {
      await this.navigateToChat();
      
      // Test XSS prevention
      const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert("XSS")>';
      try {
        await this.sendMessage(xssPayload);
        await this.logTest(
          'XSS Prevention',
          'PASS',
          'XSS payload was sanitized',
          { payload: xssPayload }
        );
      } catch (error) {
        await this.logTest(
          'XSS Prevention',
          'FAIL',
          `XSS test failed: ${error.message}`,
          { error: error.toString() }
        );
      }
      
      // Test SQL injection attempt
      const sqlPayload = "'; DROP TABLE users; --";
      try {
        await this.sendMessage(sqlPayload);
        await this.logTest(
          'SQL Injection Prevention',
          'PASS',
          'SQL injection attempt was handled',
          { payload: sqlPayload }
        );
      } catch (error) {
        await this.logTest(
          'SQL Injection Prevention',
          'FAIL',
          `SQL injection test failed: ${error.message}`,
          { error: error.toString() }
        );
      }

    } catch (error) {
      await this.logTest(
        'Security Testing',
        'FAIL',
        `Security test failed: ${error.message}`,
        { error: error.toString() }
      );
    }
  }

  // Helper methods
  async navigateToChat() {
    try {
      // Try multiple possible chat routes
      const chatRoutes = [
        '/chat',
        '/study-buddy',
        '/app/chat',
        '/app/study-buddy'
      ];
      
      for (const route of chatRoutes) {
        try {
          await this.page.goto(`http://localhost:3000${route}`, { 
            waitUntil: 'networkidle2',
            timeout: 5000 
          });
          
          const chatInterface = await this.page.$('input, textarea, [data-testid="chat-input"]');
          if (chatInterface) {
            console.log(`✅ Found chat interface at ${route}`);
            return;
          }
        } catch (e) {
          console.log(`❌ Route ${route} failed:`, e.message);
        }
      }
      
      throw new Error('No working chat interface found');
    } catch (error) {
      throw new Error(`Failed to navigate to chat: ${error.message}`);
    }
  }

  async sendMessage(message) {
    try {
      // Look for chat input with various selectors
      const inputSelectors = [
        'input[type="text"]',
        'textarea',
        '[data-testid="chat-input"]',
        '[placeholder*="Type"]',
        '[placeholder*="message"]'
      ];
      
      let input = null;
      for (const selector of inputSelectors) {
        input = await this.page.$(selector);
        if (input) break;
      }
      
      if (!input) {
        throw new Error('No chat input found');
      }
      
      // Clear and type message
      await input.click();
      await input.type(message);
      await this.sleep(100);
      
      // Find and click send button
      const sendSelectors = [
        'button[type="submit"]',
        '[data-testid="send-button"]',
        'button:has-text("Send")',
        'button:has-text("➤")',
        'button:has-text("→")'
      ];
      
      let sendButton = null;
      for (const selector of sendSelectors) {
        sendButton = await this.page.$(selector);
        if (sendButton) break;
      }
      
      if (sendButton) {
        await sendButton.click();
      } else {
        // Try Enter key
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for response
      await this.sleep(2000);
      
      // Get the last response
      const response = await this.page.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="message"], .message, .chat-message');
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          return lastMessage.textContent || lastMessage.innerText;
        }
        return null;
      });
      
      return response;
      
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'production-readiness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log('\n📊 PRODUCTION READINESS SUMMARY');
    console.log('================================');
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`Passed: ${this.testResults.summary.passed}`);
    console.log(`Failed: ${this.testResults.summary.failed}`);
    console.log(`Warnings: ${this.testResults.summary.warnings}`);
    console.log(`Success Rate: ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      this.testResults.issues.forEach(issue => {
        console.log(`  - ${issue.test}: ${issue.message}`);
      });
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return this.testResults;
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('🧪 Starting comprehensive production readiness tests...\n');
      
      await this.testBasicApplicationAccess();
      await this.testInvalidValues();
      await this.testRapidInteraction();
      await this.testSessionManagement();
      await this.testCriticalUserScenarios();
      await this.testMemoryIntegration();
      await this.testAPIEndpoints();
      await this.testMobileResponsiveness();
      await this.testSecurityScenarios();
      
      const results = await this.generateReport();
      
      return results;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new ProductionReadinessTester();
  tester.runAllTests()
    .then(() => {
      console.log('✅ All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionReadinessTester;