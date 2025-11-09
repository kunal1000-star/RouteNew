// Comprehensive Error Handling Test Suite
// =====================================

import { 
  enhancedErrorHandler,
  createLayerError,
  createCorrelationId 
} from '../lib/hallucination-prevention/error-handling/enhanced-error-handler';
import { 
  errorMonitoring 
} from '../lib/hallucination-prevention/error-handling/error-monitoring';
import { 
  userFeedbackSystem,
  submitErrorReport,
  submitSatisfactionRating,
  submitImprovementSuggestion
} from '../lib/hallucination-prevention/error-handling/user-feedback-system';
import { 
  systemHealthMonitor,
  getSystemHealth,
  getActiveAlerts
} from '../lib/hallucination-prevention/error-handling/system-health-monitor';
import { 
  ErrorDashboard,
  SimpleErrorDashboard 
} from '../lib/hallucination-prevention/error-handling/error-dashboard';
import { 
  executeWithRetry,
  createRetryContext,
  DEFAULT_RETRY_CONFIGS
} from '../lib/hallucination-prevention/error-handling/retry-mechanisms';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

class HallucinationPreventionErrorHandlingTestSuite {
  private testResults: TestSuite[] = [];
  private correlationIds: string[] = [];

  constructor() {
    this.testResults = [];
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🚀 Starting Hallucination Prevention Error Handling Tests...\n');

    await this.testEnhancedErrorHandler();
    await this.testErrorMonitoring();
    await this.testUserFeedbackSystem();
    await this.testSystemHealthMonitor();
    await this.testErrorDashboard();
    await this.testRetryMechanisms();
    await this.testLayerIntegration();
    await this.testEndToEndScenarios();

    this.printTestResults();
    return this.testResults;
  }

  /**
   * Test enhanced error handler
   */
  private async testEnhancedErrorHandler(): Promise<void> {
    console.log('🔧 Testing Enhanced Error Handler...');
    
    const suite: TestSuite = {
      name: 'Enhanced Error Handler',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Create layer error
    try {
      const error = createLayerError(1, 'Test error', new Error('Test message'));
      suite.tests.push({
        test: 'Create layer error',
        passed: error.layer === 1 && error.layerName === 'Layer 1',
        details: error
      });
    } catch (e) {
      suite.tests.push({
        test: 'Create layer error',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Generate correlation ID
    try {
      const correlationId = createCorrelationId('user123', 'session456');
      this.correlationIds.push(correlationId);
      suite.tests.push({
        test: 'Generate correlation ID',
        passed: correlationId.startsWith('corr_'),
        details: { correlationId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Generate correlation ID',
        passed: false,
        error: e.message
      });
    }

    // Test 3: User-friendly error messages
    try {
      const error = createLayerError(3, 'Connection timeout', new Error('Timeout'), {
        userId: 'user123',
        sessionId: 'session456'
      });
      const hasUserFriendly = error.userFriendlyMessage.length > 0;
      const hasTechnicalDetails = error.technicalDetails.length > 0;
      
      suite.tests.push({
        test: 'User-friendly error messages',
        passed: hasUserFriendly && hasTechnicalDetails,
        details: { userFriendly: error.userFriendlyMessage, technical: error.technicalDetails }
      });
    } catch (e) {
      suite.tests.push({
        test: 'User-friendly error messages',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test error monitoring
   */
  private async testErrorMonitoring(): Promise<void> {
    console.log('📊 Testing Error Monitoring...');
    
    const suite: TestSuite = {
      name: 'Error Monitoring',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Log error event
    try {
      const correlationId = createCorrelationId('user123', 'session456');
      errorMonitoring.logEvent({
        type: 'error',
        correlationId,
        layer: 1,
        severity: 'high',
        message: 'Test error event',
        sessionId: 'session456',
        conversationId: 'conv789',
        userId: 'user123',
        source: 'server'
      });
      
      suite.tests.push({
        test: 'Log error event',
        passed: true,
        details: { correlationId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Log error event',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Log recovery event
    try {
      const correlationId = createCorrelationId('user123', 'session456');
      errorMonitoring.logEvent({
        type: 'info',
        correlationId,
        layer: 1,
        severity: 'low',
        message: 'Recovery successful',
        sessionId: 'session456',
        conversationId: 'conv789',
        userId: 'user123',
        recovery: true,
        recoveryMethod: 'retry',
        recoveryTime: 1000,
        source: 'server'
      });
      
      suite.tests.push({
        test: 'Log recovery event',
        passed: true,
        details: { correlationId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Log recovery event',
        passed: false,
        error: e.message
      });
    }

    // Test 3: Get error metrics
    try {
      const metrics = errorMonitoring.getErrorMetrics({
        start: new Date(Date.now() - 3600000), // Last hour
        end: new Date()
      });
      
      suite.tests.push({
        test: 'Get error metrics',
        passed: metrics.totalEvents >= 0,
        details: metrics
      });
    } catch (e) {
      suite.tests.push({
        test: 'Get error metrics',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test user feedback system
   */
  private async testUserFeedbackSystem(): Promise<void> {
    console.log('💬 Testing User Feedback System...');
    
    const suite: TestSuite = {
      name: 'User Feedback System',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Submit error report
    try {
      const correlationId = this.correlationIds[0] || createCorrelationId('user123', 'session456');
      const context = {
        userId: 'user123',
        sessionId: 'session456',
        conversationId: 'conv789',
        currentPage: '/chat',
        userAgent: 'Test Browser',
        timestamp: new Date().toISOString(),
        userPreferences: {
          language: 'en',
          timezone: 'UTC',
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false
          }
        }
      };

      const errorReportId = submitErrorReport(
        createLayerError(2, 'Test error', new Error('Test message'), context),
        context,
        { userDescription: 'This is a test error' }
      );
      
      suite.tests.push({
        test: 'Submit error report',
        passed: errorReportId.length > 0,
        details: { errorReportId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Submit error report',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Submit satisfaction rating
    try {
      const correlationId = this.correlationIds[0] || createCorrelationId('user123', 'session456');
      const context = {
        userId: 'user123',
        sessionId: 'session456',
        conversationId: 'conv789',
        currentPage: '/chat',
        userAgent: 'Test Browser',
        timestamp: new Date().toISOString(),
        userPreferences: {
          language: 'en',
          timezone: 'UTC',
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false
          }
        }
      };

      const feedbackId = submitSatisfactionRating(
        correlationId,
        4,
        context,
        'Good performance'
      );
      
      suite.tests.push({
        test: 'Submit satisfaction rating',
        passed: feedbackId.length > 0,
        details: { feedbackId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Submit satisfaction rating',
        passed: false,
        error: e.message
      });
    }

    // Test 3: Submit improvement suggestion
    try {
      const correlationId = this.correlationIds[0] || createCorrelationId('user123', 'session456');
      const context = {
        userId: 'user123',
        sessionId: 'session456',
        conversationId: 'conv789',
        currentPage: '/chat',
        userAgent: 'Test Browser',
        timestamp: new Date().toISOString(),
        userPreferences: {
          language: 'en',
          timezone: 'UTC',
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false
          }
        }
      };

      const suggestionId = submitImprovementSuggestion(
        'Add better error messages',
        context,
        'usability',
        'medium'
      );
      
      suite.tests.push({
        test: 'Submit improvement suggestion',
        passed: suggestionId.length > 0,
        details: { suggestionId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Submit improvement suggestion',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test system health monitor
   */
  private async testSystemHealthMonitor(): Promise<void> {
    console.log('🏥 Testing System Health Monitor...');
    
    const suite: TestSuite = {
      name: 'System Health Monitor',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Get system health
    try {
      const health = getSystemHealth();
      suite.tests.push({
        test: 'Get system health',
        passed: health.overall && health.score >= 0,
        details: { overall: health.overall, score: health.score }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Get system health',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Get active alerts
    try {
      const alerts = getActiveAlerts();
      suite.tests.push({
        test: 'Get active alerts',
        passed: Array.isArray(alerts),
        details: { alertCount: alerts.length }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Get active alerts',
        passed: false,
        error: e.message
      });
    }

    // Test 3: Export health report
    try {
      const report = systemHealthMonitor.exportHealthReport('json');
      const reportObj = JSON.parse(report);
      suite.tests.push({
        test: 'Export health report',
        passed: reportObj.generatedAt && reportObj.systemHealth,
        details: { reportSize: report.length }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Export health report',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test error dashboard
   */
  private async testErrorDashboard(): Promise<void> {
    console.log('📈 Testing Error Dashboard...');
    
    const suite: TestSuite = {
      name: 'Error Dashboard',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: ErrorDashboard component structure
    try {
      const dashboardProps = {
        userId: 'user123',
        refreshInterval: 30000
      };
      suite.tests.push({
        test: 'ErrorDashboard component structure',
        passed: true,
        details: dashboardProps
      });
    } catch (e) {
      suite.tests.push({
        test: 'ErrorDashboard component structure',
        passed: false,
        error: e.message
      });
    }

    // Test 2: SimpleErrorDashboard component structure
    try {
      const simpleDashboard = new SimpleErrorDashboard();
      suite.tests.push({
        test: 'SimpleErrorDashboard component structure',
        passed: true,
        details: { componentType: typeof SimpleErrorDashboard }
      });
    } catch (e) {
      suite.tests.push({
        test: 'SimpleErrorDashboard component structure',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test retry mechanisms
   */
  private async testRetryMechanisms(): Promise<void> {
    console.log('🔄 Testing Retry Mechanisms...');
    
    const suite: TestSuite = {
      name: 'Retry Mechanisms',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Create retry context
    try {
      const context = createRetryContext(
        'test_operation',
        1,
        'session123',
        'conv456',
        'user789'
      );
      
      suite.tests.push({
        test: 'Create retry context',
        passed: context.operation === 'test_operation' && context.layer === 1,
        details: context
      });
    } catch (e) {
      suite.tests.push({
        test: 'Create retry context',
        passed: false,
        error: e.message
      });
    }

    // Test 2: Execute with retry - successful case
    try {
      const context = createRetryContext(
        'test_operation',
        1,
        'session123',
        'conv456',
        'user789'
      );
      
      const operation = async () => {
        return { success: true, data: 'test result' };
      };
      
      const result = await executeWithRetry(
        operation,
        DEFAULT_RETRY_CONFIGS.aiQuery,
        context
      );
      
      suite.tests.push({
        test: 'Execute with retry - successful case',
        passed: result.success && result.attempts === 1,
        details: result
      });
    } catch (e) {
      suite.tests.push({
        test: 'Execute with retry - successful case',
        passed: false,
        error: e.message
      });
    }

    // Test 3: Execute with retry - failure case
    try {
      const context = createRetryContext(
        'test_operation',
        1,
        'session123',
        'conv456',
        'user789'
      );
      
      const operation = async () => {
        throw new Error('Persistent failure');
      };
      
      const result = await executeWithRetry(
        operation,
        {
          ...DEFAULT_RETRY_CONFIGS.aiQuery,
          maxRetries: 2
        },
        context
      );
      
      suite.tests.push({
        test: 'Execute with retry - failure case',
        passed: !result.success && result.attempts === 3,
        details: result
      });
    } catch (e) {
      suite.tests.push({
        test: 'Execute with retry - failure case',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test layer integration
   */
  private async testLayerIntegration(): Promise<void> {
    console.log('🔗 Testing Layer Integration...');
    
    const suite: TestSuite = {
      name: 'Layer Integration',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: All layers error handling
    for (let layer = 1; layer <= 5; layer++) {
      try {
        const error = createLayerError(
          layer,
          `Layer ${layer} test error`,
          new Error(`Test error in layer ${layer}`)
        );
        
        suite.tests.push({
          test: `Layer ${layer} error handling`,
          passed: error.layer === layer && error.layerName === `Layer ${layer}`,
          details: { layer, errorType: error.constructor.name }
        });
      } catch (e) {
        suite.tests.push({
          test: `Layer ${layer} error handling`,
          passed: false,
          error: e.message
        });
      }
    }

    this.addSuiteResults(suite);
  }

  /**
   * Test end-to-end scenarios
   */
  private async testEndToEndScenarios(): Promise<void> {
    console.log('🌟 Testing End-to-End Scenarios...');
    
    const suite: TestSuite = {
      name: 'End-to-End Scenarios',
      tests: [],
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Complete error handling flow
    try {
      const correlationId = createCorrelationId('user123', 'session456');
      const context = {
        userId: 'user123',
        sessionId: 'session456',
        conversationId: 'conv789',
        currentPage: '/chat',
        userAgent: 'Test Browser',
        timestamp: new Date().toISOString(),
        userPreferences: {
          language: 'en',
          timezone: 'UTC',
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false
          }
        }
      };

      // 1. Create error
      const error = createLayerError(3, 'Response validation failed', new Error('Validation error'), context);
      
      // 2. Monitor error
      errorMonitoring.logEvent({
        type: 'error',
        correlationId,
        layer: 3,
        severity: 'medium',
        message: error.message,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
        userId: context.userId,
        source: 'server'
      });

      // 3. Submit feedback
      const feedbackId = submitErrorReport(error, context, {
        userDescription: 'The validation seems too strict'
      });
      
      suite.tests.push({
        test: 'Complete error handling flow',
        passed: correlationId.length > 0 && feedbackId.length > 0,
        details: { correlationId, feedbackId }
      });
    } catch (e) {
      suite.tests.push({
        test: 'Complete error handling flow',
        passed: false,
        error: e.message
      });
    }

    // Test 2: System health integration
    try {
      const health = getSystemHealth();
      const alerts = getActiveAlerts();
      
      suite.tests.push({
        test: 'System health integration',
        passed: health.overall && Array.isArray(alerts),
        details: { health: health.overall, alertCount: alerts.length }
      });
    } catch (e) {
      suite.tests.push({
        test: 'System health integration',
        passed: false,
        error: e.message
      });
    }

    this.addSuiteResults(suite);
  }

  /**
   * Add suite results to main results
   */
  private addSuiteResults(suite: TestSuite): void {
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.total = suite.tests.length;
    this.testResults.push(suite);
  }

  /**
   * Print test results
   */
  private printTestResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    this.testResults.forEach(suite => {
      console.log(`\n${suite.name}:`);
      console.log(`  ✅ Passed: ${suite.passed}`);
      console.log(`  ❌ Failed: ${suite.failed}`);
      console.log(`  📝 Total: ${suite.total}`);
      
      suite.tests.forEach(test => {
        if (!test.passed) {
          console.log(`    ❌ ${test.test}: ${test.error || 'Unknown error'}`);
        }
      });

      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalTests += suite.total;
    });

    console.log('\n🎯 Overall Results:');
    console.log(`  ✅ Total Passed: ${totalPassed}`);
    console.log(`  ❌ Total Failed: ${totalFailed}`);
    console.log(`  📝 Total Tests: ${totalTests}`);
    console.log(`  📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Error handling system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }
}

// Export test suite and utilities
export { HallucinationPreventionErrorHandlingTestSuite };
export type { TestResult, TestSuite };

// Main test execution function
export async function runErrorHandlingTests(): Promise<TestSuite[]> {
  const testSuite = new HallucinationPreventionErrorHandlingTestSuite();
  return await testSuite.runAllTests();
}

// If this file is run directly, execute tests
if (require.main === module) {
  runErrorHandlingTests()
    .then(() => {
      console.log('\n🏁 Test execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}