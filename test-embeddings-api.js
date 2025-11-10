#!/usr/bin/env node

/**
 * AI Embeddings API Test Suite
 * ============================
 * 
 * Comprehensive testing of the embeddings endpoint including:
 * - Basic embedding generation
 * - Semantic search
 * - Batch processing
 * - Comparison operations
 * - Health checks
 * - Error handling
 */

const API_BASE = 'http://localhost:3000/api/ai/embeddings';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

class EmbeddingsAPITester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: result,
        responseTime: result.processingTime
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: { error: error.message },
        responseTime: 0
      };
    }
  }

  async makeGetRequest(endpoint) {
    try {
      const response = await fetch(endpoint);
      const result = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: result,
        responseTime: 0
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: { error: error.message },
        responseTime: 0
      };
    }
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    
    try {
      const result = await testFn();
      this.results.push({ name, ...result, passed: result.success });
      
      if (result.success) {
        console.log(`✅ PASS: ${name} (${result.responseTime}ms)`);
        this.passed++;
      } else {
        console.log(`❌ FAIL: ${name} - ${result.error || 'Test failed'}`);
        this.failed++;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${name} - ${error.message}`);
      this.results.push({ name, success: false, error: error.message, passed: false });
      this.failed++;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting AI Embeddings API Test Suite\n');
    console.log('=' .repeat(50));

    // Test 1: Basic embedding generation
    await this.test('Basic Embedding Generation', async () => {
      const response = await this.makeRequest(API_BASE, {
        operation: 'embed',
        texts: ['Hello world', 'This is a test'],
        preferredProvider: 'cohere'
      });

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Request failed'}` };
      }

      if (!response.data.embeddings || response.data.embeddings.length !== 2) {
        return { success: false, error: 'Expected 2 embeddings, got ' + (response.data.embeddings?.length || 0) };
      }

      if (!response.data.dimensions || response.data.dimensions < 100) {
        return { success: false, error: 'Invalid dimensions: ' + response.data.dimensions };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Generated ${response.data.embeddings.length} embeddings with ${response.data.dimensions} dimensions`
      };
    });

    // Test 2: Single text embedding
    await this.test('Single Text Embedding', async () => {
      const response = await this.makeRequest(API_BASE, {
        operation: 'embed',
        text: 'Machine learning is amazing',
        preferredProvider: 'cohere'
      });

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Request failed'}` };
      }

      if (!response.data.embeddings || response.data.embeddings.length !== 1) {
        return { success: false, error: 'Expected 1 embedding' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Single embedding generated successfully`
      };
    });

    // Test 3: Batch processing
    await this.test('Batch Processing', async () => {
      const texts = [
        'Artificial intelligence revolution',
        'Neural networks and deep learning',
        'Computer vision applications',
        'Natural language processing',
        'Machine learning algorithms',
        'Data science and analytics'
      ];

      const response = await this.makeRequest(API_BASE, {
        operation: 'batch',
        texts: texts,
        batchSize: 3,
        parallel: true
      });

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Request failed'}` };
      }

      if (!response.data.embeddings || response.data.embeddings.length !== texts.length) {
        return { success: false, error: `Expected ${texts.length} embeddings, got ${response.data.embeddings?.length || 0}` };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Batch processed ${texts.length} texts`
      };
    });

    // Test 4: Comparison operations
    await this.test('Text Comparison', async () => {
      const response = await this.makeRequest(API_BASE, {
        operation: 'compare',
        texts: [
          'Dogs are loyal animals',
          'Cats are independent pets',
          'Dogs make great companions'
        ],
        similarityMetric: 'cosine'
      });

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Request failed'}` };
      }

      if (!response.data.comparisons || response.data.comparisons.length !== 3) {
        return { success: false, error: `Expected 3 comparisons, got ${response.data.comparisons?.length || 0}` };
      }

      // Find the comparison between similar texts
      const dogComparison = response.data.comparisons.find(c => 
        (c.text1.includes('Dogs') && c.text2.includes('Dogs')) ||
        (c.text1.includes('Dogs') && c.text2.includes('companions')) ||
        (c.text1.includes('companions') && c.text2.includes('Dogs'))
      );

      if (!dogComparison || dogComparison.similarity < 0.3) {
        return { success: false, error: 'Similar texts should have higher similarity score' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Text comparisons calculated, highest similarity: ${dogComparison.similarity.toFixed(3)}`
      };
    });

    // Test 5: Health check
    await this.test('Health Check', async () => {
      const response = await this.makeGetRequest(`${API_BASE}/health`);

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Health check failed'}` };
      }

      if (response.data.status !== 'healthy') {
        return { success: false, error: 'System health check failed' };
      }

      const providers = Object.keys(response.data.providers || {});
      if (providers.length === 0) {
        return { success: false, error: 'No providers found in health check' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `${providers.length} providers checked: ${providers.join(', ')}`
      };
    });

    // Test 6: Statistics endpoint
    await this.test('Statistics Endpoint', async () => {
      const response = await this.makeGetRequest(API_BASE);

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Stats failed'}` };
      }

      if (!response.data.usage) {
        return { success: false, error: 'Usage statistics missing' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Usage stats retrieved successfully`
      };
    });

    // Test 7: Error handling - invalid operation
    await this.test('Error Handling - Invalid Operation', async () => {
      const response = await this.makeRequest(API_BASE, {
        operation: 'invalid_operation',
        text: 'test'
      });

      if (response.success) {
        return { success: false, error: 'Should have failed with invalid operation' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: 'Properly handled invalid operation'
      };
    });

    // Test 8: Error handling - missing parameters
    await this.test('Error Handling - Missing Parameters', async () => {
      const response = await this.makeRequest(API_BASE, {
        operation: 'embed'
        // Missing texts/text parameter
      });

      if (response.success) {
        return { success: false, error: 'Should have failed with missing parameters' };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: 'Properly handled missing parameters'
      };
    });

    // Test 9: Large batch processing
    await this.test('Large Batch Processing', async () => {
      const largeTextSet = Array.from({ length: 20 }, (_, i) => 
        `This is test document number ${i + 1} for batch processing`
      );

      const response = await this.makeRequest(API_BASE, {
        operation: 'batch',
        texts: largeTextSet,
        batchSize: 5,
        parallel: false
      });

      if (!response.success) {
        return { success: false, error: `HTTP ${response.status}: ${response.data.error || 'Batch failed'}` };
      }

      if (!response.data.embeddings || response.data.embeddings.length !== largeTextSet.length) {
        return { success: false, error: `Expected ${largeTextSet.length} embeddings, got ${response.data.embeddings?.length || 0}` };
      }

      return { 
        success: true, 
        responseTime: response.responseTime,
        details: `Large batch of ${largeTextSet.length} texts processed successfully`
      };
    });

    // Test 10: Performance with caching
    await this.test('Caching Performance', async () => {
      const testText = 'cache this text for performance';
      
      // First request
      const response1 = await this.makeRequest(API_BASE, {
        operation: 'embed',
        text: testText
      });

      if (!response1.success) {
        return { success: false, error: 'First embedding generation failed' };
      }

      // Second request (should potentially use cache)
      const response2 = await this.makeRequest(API_BASE, {
        operation: 'embed',
        text: testText
      });

      if (!response2.success) {
        return { success: false, error: 'Second embedding generation failed' };
      }

      const time1 = response1.responseTime;
      const time2 = response2.responseTime;
      
      return { 
        success: true, 
        responseTime: time1 + time2,
        details: `First: ${time1}ms, Second: ${time2}ms${time2 < time1 ? ' (faster - possible cache hit)' : ''}`
      };
    });

    // Generate final report
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n🚨 Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎯 Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}${result.details ? ` - ${result.details}` : ''}${result.error ? ` - ${result.error}` : ''}`);
    });

    console.log('\n' + '=' .repeat(50));
    
    if (this.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Embeddings API is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the issues above.');
    }
    
    console.log('=' .repeat(50));
  }
}

// Run the tests
async function main() {
  const tester = new EmbeddingsAPITester();
  await tester.runAllTests();
}

// Check if we can connect to the server
async function checkServerConnection() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/embeddings/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return true;
    } else {
      console.log(`⚠️  Server responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure the development server is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   cd c:/Users/kunal/Ruther/ROUTE && npm run dev');
    return false;
  }
}

// Main execution
if (require.main === module) {
  checkServerConnection().then(connected => {
    if (connected) {
      main().catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
      });
    } else {
      console.log('\n🔧 To start the server:');
      console.log('1. Open a new terminal');
      console.log('2. Navigate to the project directory: cd c:/Users/kunal/Ruther/ROUTE');
      console.log('3. Run: npm run dev');
      console.log('4. In another terminal, run this test again');
      process.exit(1);
    }
  });
}

module.exports = { EmbeddingsAPITester };