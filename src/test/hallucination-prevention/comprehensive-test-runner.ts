/**
 * Comprehensive Test Runner for 5-Layer Hallucination Prevention System
 * ================================================================
 * 
 * This test runner orchestrates all tests for the hallucination prevention system
 * including real-world scenarios, layer-specific tests, and integration tests.
 */

import { logInfo, logError } from '../../lib/error-logger';

// Import layer-specific test modules
import { runLayer1ComprehensiveTests } from './layer1/layer1-comprehensive-tests';
import { runLayer2ComprehensiveTests } from './layer2/layer2-comprehensive-tests';
import { runLayer3ComprehensiveTests } from './layer3/layer3-comprehensive-tests';
import { runLayer4ComprehensiveTests } from './layer4/layer4-comprehensive-tests';
import { runLayer5ComprehensiveTests } from './layer5/layer5-comprehensive-tests';
import { runRealWorldTestScenarios } from './real-world/real-world-scenarios';
import { runIntegrationTestSuite } from './integration/integration-test-suite';
import { generateTestReport } from './reports/test-report-generator';

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  success: boolean;
  details: any;
  errors: string[];
  warnings: string[];
}

export interface ComprehensiveTestResults {
  timestamp: Date;
  totalDuration: number;
  overallSuccess: boolean;
  layer1: TestSuiteResult;
  layer2: TestSuiteResult;
  layer3: TestSuiteResult;
  layer4: TestSuiteResult;
  layer5: TestSuiteResult;
  realWorldScenarios: TestSuiteResult;
  integrationTests: TestSuiteResult;
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    successRate: number;
    averageDuration: number;
  };
  recommendations: string[];
  criticalIssues: string[];
}

class ComprehensiveTestRunner {
  private results: Map<string, TestSuiteResult> = new Map();
  private startTime: number = 0;

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<ComprehensiveTestResults> {
    this.startTime = Date.now();
    logInfo('Starting comprehensive hallucination prevention test suite', {
      componentName: 'ComprehensiveTestRunner'
    });

    console.log('🧪 Starting Comprehensive 5-Layer Hallucination Prevention Test Suite');
    console.log('='.repeat(80));
    console.log('');

    try {
      // Run Layer 1 tests
      console.log('📊 Running Layer 1 Tests (Input Validation & Classification)...');
      this.results.set('layer1', await this.runWithErrorHandling('layer1', runLayer1ComprehensiveTests));
      console.log('');

      // Run Layer 2 tests
      console.log('📊 Running Layer 2 Tests (Context & Memory Management)...');
      this.results.set('layer2', await this.runWithErrorHandling('layer2', runLayer2ComprehensiveTests));
      console.log('');

      // Run Layer 3 tests
      console.log('📊 Running Layer 3 Tests (Validation & Fact-Checking)...');
      this.results.set('layer3', await this.runWithErrorHandling('layer3', runLayer3ComprehensiveTests));
      console.log('');

      // Run Layer 4 tests
      console.log('📊 Running Layer 4 Tests (Feedback & Learning)...');
      this.results.set('layer4', await this.runWithErrorHandling('layer4', runLayer4ComprehensiveTests));
      console.log('');

      // Run Layer 5 tests
      console.log('📊 Running Layer 5 Tests (Orchestration & Monitoring)...');
      this.results.set('layer5', await this.runWithErrorHandling('layer5', runLayer5ComprehensiveTests));
      console.log('');

      // Run real-world scenarios
      console.log('🌍 Running Real-World Test Scenarios...');
      this.results.set('realWorldScenarios', await this.runWithErrorHandling('realWorldScenarios', runRealWorldTestScenarios));
      console.log('');

      // Run integration tests
      console.log('🔗 Running Integration Test Suite...');
      this.results.set('integrationTests', await this.runWithErrorHandling('integrationTests', runIntegrationTestSuite));
      console.log('');

      // Generate comprehensive results
      const finalResults = this.generateFinalResults();
      
      // Generate and save test report
      const reportPath = await generateTestReport(finalResults);
      console.log(`📄 Test report generated: ${reportPath}`);

      this.printSummary(finalResults);
      
      return finalResults;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        componentName: 'ComprehensiveTestRunner'
      });
      
      throw error;
    }
  }

  /**
   * Run a test suite with error handling
   */
  private async runWithErrorHandling(
    suiteName: string, 
    testFunction: () => Promise<TestSuiteResult>
  ): Promise<TestSuiteResult> {
    try {
      const result = await testFunction();
      this.results.set(suiteName, result);
      return result;
    } catch (error) {
      const errorResult: TestSuiteResult = {
        suiteName,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration: 0,
        success: false,
        details: null,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
      this.results.set(suiteName, errorResult);
      return errorResult;
    }
  }

  /**
   * Generate final comprehensive results
   */
  private generateFinalResults(): ComprehensiveTestResults {
    const allResults = Array.from(this.results.values());
    const totalTests = allResults.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = allResults.reduce((sum, r) => sum + r.passedTests, 0);
    const totalFailed = allResults.reduce((sum, r) => sum + r.failedTests, 0);
    const totalSkipped = allResults.reduce((sum, r) => sum + r.skippedTests, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    const criticalIssues = allResults
      .filter(r => !r.success)
      .map(r => `${r.suiteName}: ${r.errors.join(', ')}`);

    const recommendations = this.generateRecommendations(allResults);

    return {
      timestamp: new Date(),
      totalDuration: Date.now() - this.startTime,
      overallSuccess: successRate >= 80, // 80% success rate threshold
      layer1: this.results.get('layer1')!,
      layer2: this.results.get('layer2')!,
      layer3: this.results.get('layer3')!,
      layer4: this.results.get('layer4')!,
      layer5: this.results.get('layer5')!,
      realWorldScenarios: this.results.get('realWorldScenarios')!,
      integrationTests: this.results.get('integrationTests')!,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        successRate,
        averageDuration
      },
      recommendations,
      criticalIssues
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: TestSuiteResult[]): string[] {
    const recommendations: string[] = [];

    // Check for failed test suites
    const failedSuites = results.filter(r => !r.success);
    if (failedSuites.length > 0) {
      recommendations.push(
        `Address failures in ${failedSuites.length} test suite(s): ${failedSuites.map(s => s.suiteName).join(', ')}`
      );
    }

    // Check for performance issues
    const slowSuites = results.filter(r => r.duration > 30000); // > 30 seconds
    if (slowSuites.length > 0) {
      recommendations.push(
        `Optimize performance in ${slowSuites.length} test suite(s): ${slowSuites.map(s => s.suiteName).join(', ')}`
      );
    }

    // Check for high error rates
    const highErrorRateSuites = results.filter(r => 
      r.totalTests > 0 && (r.failedTests / r.totalTests) > 0.2
    );
    if (highErrorRateSuites.length > 0) {
      recommendations.push(
        `Investigate high error rates in ${highErrorRateSuites.length} test suite(s): ${highErrorRateSuites.map(s => s.suiteName).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Print test summary
   */
  private printSummary(results: ComprehensiveTestResults): void {
    console.log('📈 TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Success: ${results.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Duration: ${results.totalDuration}ms`);
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.totalPassed}`);
    console.log(`Failed: ${results.summary.totalFailed}`);
    console.log(`Skipped: ${results.summary.totalSkipped}`);
    console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`);
    console.log('');

    console.log('📊 Individual Test Suite Results:');
    console.log('-'.repeat(50));
    [
      results.layer1, results.layer2, results.layer3, 
      results.layer4, results.layer5, results.realWorldScenarios, 
      results.integrationTests
    ].forEach(result => {
      console.log(`${result.suiteName}: ${result.passedTests}/${result.totalTests} passed (${((result.passedTests/result.totalTests)*100).toFixed(1)}%)`);
    });

    if (results.recommendations.length > 0) {
      console.log('');
      console.log('💡 Recommendations:');
      results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    if (results.criticalIssues.length > 0) {
      console.log('');
      console.log('🚨 Critical Issues:');
      results.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
  }
}

// Export main function
export async function runComprehensiveHallucinationPreventionTests(): Promise<ComprehensiveTestResults> {
  const runner = new ComprehensiveTestRunner();
  return await runner.runAllTests();
}

// Export for use in other modules
export { ComprehensiveTestRunner };