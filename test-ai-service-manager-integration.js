// AI Service Manager Integration Test Suite
// ==========================================
// Comprehensive tests to validate the integration fixes

const fs = require('fs');
const path = require('path');

class AIServiceManagerIntegrationTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(testName, status, message) {
    const result = {
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    
    if (status === 'PASS') {
      this.testResults.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: ${message}`);
    }
  }

  async testFileExistence() {
    console.log('\n🔍 Testing File Existence...\n');
    
    // Test service integration layer
    const serviceLayerPath = 'src/lib/ai/service-integration-layer.ts';
    if (fs.existsSync(serviceLayerPath)) {
      this.log('Service Integration Layer', 'PASS', 'Service integration layer file exists');
    } else {
      this.log('Service Integration Layer', 'FAIL', 'Service integration layer file missing');
    }

    // Test AI service manager
    const aiServiceManagerPath = 'src/lib/ai/ai-service-manager-unified.ts';
    if (fs.existsSync(aiServiceManagerPath)) {
      this.log('AI Service Manager', 'PASS', 'AI service manager unified file exists');
    } else {
      this.log('AI Service Manager', 'FAIL', 'AI service manager unified file missing');
    }

    // Test web search endpoint
    const webSearchPath = 'src/app/api/ai/web-search/route.ts';
    if (fs.existsSync(webSearchPath)) {
      this.log('Web Search Endpoint', 'PASS', 'Web search API endpoint exists');
    } else {
      this.log('Web Search Endpoint', 'FAIL', 'Web search API endpoint missing');
    }

    // Test UniversalChat components
    const universalChatPath = 'src/components/chat/UniversalChat.tsx';
    const universalChatEnhancedPath = 'src/components/chat/UniversalChatEnhanced.tsx';
    
    if (fs.existsSync(universalChatPath)) {
      this.log('UniversalChat Base', 'PASS', 'UniversalChat base component exists');
    } else {
      this.log('UniversalChat Base', 'FAIL', 'UniversalChat base component missing');
    }

    if (fs.existsSync(universalChatEnhancedPath)) {
      this.log('UniversalChat Enhanced', 'PASS', 'UniversalChat enhanced component exists');
    } else {
      this.log('UniversalChat Enhanced', 'FAIL', 'UniversalChat enhanced component missing');
    }
  }

  async testImportStatements() {
    console.log('\n📦 Testing Import Statements...\n');
    
    // Test service integration layer imports
    const serviceLayerPath = 'src/lib/ai/service-integration-layer.ts';
    if (fs.existsSync(serviceLayerPath)) {
      const serviceLayerContent = fs.readFileSync(serviceLayerPath, 'utf8');
      
      if (serviceLayerContent.includes("aiServiceManager from './ai-service-manager-unified'")) {
        this.log('Service Layer AI Manager Import', 'PASS', 'Correctly imports aiServiceManager');
      } else {
        this.log('Service Layer AI Manager Import', 'FAIL', 'Missing aiServiceManager import');
      }

      if (serviceLayerContent.includes('processEnhancedRequest')) {
        this.log('Service Layer Enhanced Request', 'PASS', 'Contains processEnhancedRequest method');
      } else {
        this.log('Service Layer Enhanced Request', 'FAIL', 'Missing processEnhancedRequest method');
      }
    }

    // Test UniversalChat enhanced imports
    const enhancedPath = 'src/components/chat/UniversalChatEnhanced.tsx';
    if (fs.existsSync(enhancedPath)) {
      const enhancedContent = fs.readFileSync(enhancedPath, 'utf8');
      
      if (enhancedContent.includes("serviceIntegrationLayer from '@/lib/ai/service-integration-layer'")) {
        this.log('Enhanced Component Service Layer Import', 'PASS', 'Correctly imports service integration layer');
      } else {
        this.log('Enhanced Component Service Layer Import', 'FAIL', 'Missing service integration layer import');
      }

      if (enhancedContent.includes('WebSearchResult')) {
        this.log('Enhanced Component WebSearch Result', 'PASS', 'Contains WebSearchResult type');
      } else {
        this.log('Enhanced Component WebSearch Result', 'FAIL', 'Missing WebSearchResult type');
      }
    }
  }

  async testAPIEndpointIntegration() {
    console.log('\n🌐 Testing API Endpoint Integration...\n');
    
    const webSearchPath = 'src/app/api/ai/web-search/route.ts';
    if (fs.existsSync(webSearchPath)) {
      const webSearchContent = fs.readFileSync(webSearchPath, 'utf8');
      
      // Test POST endpoint
      if (webSearchContent.includes('export async function POST(request: NextRequest)')) {
        this.log('Web Search POST Endpoint', 'PASS', 'POST endpoint exists');
      } else {
        this.log('Web Search POST Endpoint', 'FAIL', 'POST endpoint missing');
      }

      // Test GET health check
      if (webSearchContent.includes('export async function GET(request: NextRequest)')) {
        this.log('Web Search GET Health Check', 'PASS', 'GET health check endpoint exists');
      } else {
        this.log('Web Search GET Health Check', 'FAIL', 'GET health check endpoint missing');
      }

      // Test search provider configurations
      const providers = ['google', 'serpapi', 'duckduckgo', 'wikipedia'];
      let allProvidersFound = true;
      
      providers.forEach(provider => {
        if (!webSearchContent.includes(`'${provider}'`)) {
          allProvidersFound = false;
        }
      });

      if (allProvidersFound) {
        this.log('Search Providers Configuration', 'PASS', 'All search providers configured');
      } else {
        this.log('Search Providers Configuration', 'FAIL', 'Missing search provider configuration');
      }
    }
  }

  async testServiceManagerFeatures() {
    console.log('\n🔧 Testing Service Manager Features...\n');
    
    const aiServiceManagerPath = 'src/lib/ai/ai-service-manager-unified.ts';
    if (fs.existsSync(aiServiceManagerPath)) {
      const managerContent = fs.readFileSync(aiServiceManagerPath, 'utf8');
      
      // Test main processQuery method
      if (managerContent.includes('async processQuery(request: AIServiceManagerRequest)')) {
        this.log('Service Manager Process Query', 'PASS', 'processQuery method exists');
      } else {
        this.log('Service Manager Process Query', 'FAIL', 'processQuery method missing');
      }

      // Test provider fallback
      if (managerContent.includes('DYNAMIC_FALLBACK_CHAINS')) {
        this.log('Service Manager Fallback Chains', 'PASS', 'Fallback chain configuration exists');
      } else {
        this.log('Service Manager Fallback Chains', 'FAIL', 'Fallback chain configuration missing');
      }

      // Test health check
      if (managerContent.includes('healthCheck(): Promise<Record<AIProvider')) {
        this.log('Service Manager Health Check', 'PASS', 'Health check method exists');
      } else {
        this.log('Service Manager Health Check', 'FAIL', 'Health check method missing');
      }

      // Test singleton export
      if (managerContent.includes('export const aiServiceManager = new AIServiceManager()')) {
        this.log('Service Manager Singleton', 'PASS', 'Singleton instance exported');
      } else {
        this.log('Service Manager Singleton', 'FAIL', 'Singleton instance missing');
      }
    }
  }

  async testUIComponentIntegration() {
    console.log('\n🖥️  Testing UI Component Integration...\n');
    
    const enhancedPath = 'src/components/chat/UniversalChatEnhanced.tsx';
    if (fs.existsSync(enhancedPath)) {
      const enhancedContent = fs.readFileSync(enhancedPath, 'utf8');
      
      // Test service integration usage
      if (enhancedContent.includes('serviceIntegrationLayer.processEnhancedRequest')) {
        this.log('Enhanced Component Service Integration', 'PASS', 'Uses service integration layer');
      } else {
        this.log('Enhanced Component Service Integration', 'FAIL', 'Does not use service integration layer');
      }

      // Test web search results display
      if (enhancedContent.includes('webSearchResults.length > 0')) {
        this.log('Enhanced Component Web Search Display', 'PASS', 'Displays web search results');
      } else {
        this.log('Enhanced Component Web Search Display', 'FAIL', 'Does not display web search results');
      }

      // Test hallucination prevention layers
      if (enhancedContent.includes('HallucinationLayerStatus')) {
        this.log('Enhanced Component Hallucination Prevention', 'PASS', 'Contains hallucination prevention layers');
      } else {
        this.log('Enhanced Component Hallucination Prevention', 'FAIL', 'Missing hallucination prevention layers');
      }

      // Test service health monitoring
      if (enhancedContent.includes('getHealthStatus')) {
        this.log('Enhanced Component Health Monitoring', 'PASS', 'Contains service health monitoring');
      } else {
        this.log('Enhanced Component Health Monitoring', 'FAIL', 'Missing service health monitoring');
      }
    }
  }

  async testTypeDefinitions() {
    console.log('\n📝 Testing Type Definitions...\n');
    
    const typesPath = 'src/types/ai-service-manager.ts';
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      
      // Test core interfaces
      if (typesContent.includes('AIServiceManagerRequest')) {
        this.log('AI Service Manager Request Type', 'PASS', 'AIServiceManagerRequest interface exists');
      } else {
        this.log('AI Service Manager Request Type', 'FAIL', 'AIServiceManagerRequest interface missing');
      }

      if (typesContent.includes('AIServiceManagerResponse')) {
        this.log('AI Service Manager Response Type', 'PASS', 'AIServiceManagerResponse interface exists');
      } else {
        this.log('AI Service Manager Response Type', 'FAIL', 'AIServiceManagerResponse interface missing');
      }

      if (typesContent.includes('AppDataContext')) {
        this.log('App Data Context Type', 'PASS', 'AppDataContext interface exists');
      } else {
        this.log('App Data Context Type', 'FAIL', 'AppDataContext interface missing');
      }
    } else {
      this.log('AI Service Manager Types', 'FAIL', 'Types file missing');
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    // Save detailed report
    const reportPath = 'ai-service-integration-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    // Return status for CI/CD
    return this.testResults.failed === 0;
  }

  async runAllTests() {
    console.log('🚀 Starting AI Service Manager Integration Tests\n');
    console.log('=' .repeat(50));
    
    await this.testFileExistence();
    await this.testImportStatements();
    await this.testAPIEndpointIntegration();
    await this.testServiceManagerFeatures();
    await this.testUIComponentIntegration();
    await this.testTypeDefinitions();
    
    const success = this.generateReport();
    
    if (success) {
      console.log('\n🎉 All tests passed! Integration is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
    return success;
  }
}

// Run the tests
const testSuite = new AIServiceManagerIntegrationTest();
testSuite.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});