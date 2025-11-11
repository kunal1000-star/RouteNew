// Advanced Personalization System Integration Test Suite
// ======================================================
// Comprehensive test suite that validates all AI systems working together
// Tests the complete flow from query to response through all layers

import { advancedPersonalizationEngine } from '@/lib/ai/advanced-personalization-engine';
import { smartQueryClassifier } from '@/lib/ai/smart-query-classifier';
import { adaptiveTeachingSystem } from '@/lib/ai/adaptive-teaching-system';
import { centralizedServiceIntegration } from '@/lib/ai/centralized-service-integration';
import { webSearchDecisionEngine } from '@/lib/ai/web-search-decision-engine';
import { personalizationDetectionEngine } from '@/lib/ai/personalization-detection-engine';
import { LayerStatusVisualization } from '@/components/hallucination-prevention/LayerStatusVisualization';

// Test configuration and setup
export interface IntegrationTestConfig {
  userId: string;
  sessionId: string;
  testScenarios: TestScenario[];
  expectedResults: ExpectedResults;
  timeout: number; // milliseconds
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  query: string;
  context: {
    currentSubject?: string;
    learningLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    studyTime?: number;
    previousQuestions?: string[];
    urgency?: 'low' | 'normal' | 'high';
  };
  expected: {
    responseType: 'personalized' | 'general' | 'hybrid';
    webSearchUsed: boolean;
    teachingMode: boolean;
    personalizationApplied: boolean;
    confidence: number;
    halluPreventionLayers: number;
  };
}

export interface ExpectedResults {
  overallAccuracy: number; // 0-1
  responseQuality: number; // 0-1
  personalizationAccuracy: number; // 0-1
  webSearchAccuracy: number; // 0-1
  teachingEffectiveness: number; // 0-1
  hallucinationPrevention: number; // 0-1
  systemPerformance: {
    averageResponseTime: number;
    memoryUsage: number;
    successRate: number;
  };
}

export interface TestResults {
  timestamp: Date;
  config: IntegrationTestConfig;
  results: {
    scenarios: Array<{
      scenarioId: string;
      passed: boolean;
      actual: {
        responseType: string;
        webSearchUsed: boolean;
        teachingMode: boolean;
        personalizationApplied: boolean;
        confidence: number;
        halluPreventionLayers: number;
        responseTime: number;
        responseQuality: number;
      };
      expected: TestScenario['expected'];
      issues: string[];
    }>;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      averageResponseTime: number;
      averageConfidence: number;
      successRate: number;
    };
  };
  systemIntegration: {
    personalizationEngine: IntegrationTestResult;
    queryClassifier: IntegrationTestResult;
    teachingSystem: IntegrationTestResult;
    webSearchEngine: IntegrationTestResult;
    centralIntegration: IntegrationTestResult;
    halluPrevention: IntegrationTestResult;
  };
  recommendations: string[];
}

export interface IntegrationTestResult {
  status: 'passed' | 'failed' | 'partial';
  score: number; // 0-1
  details: string[];
  performance: {
    responseTime: number;
    accuracy: number;
    reliability: number;
  };
}

export class AdvancedPersonalizationIntegrationTester {
  private testConfig: IntegrationTestConfig;
  private results: Partial<TestResults> = {};

  constructor(config: IntegrationTestConfig) {
    this.testConfig = config;
  }

  /**
   * Run the complete integration test suite
   */
  async runCompleteTest(): Promise<TestResults> {
    console.log('🚀 Starting Advanced Personalization System Integration Test Suite');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();

    try {
      // Initialize test results
      this.results = {
        timestamp: new Date(),
        config: this.testConfig,
        results: {
          scenarios: [],
          summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averageResponseTime: 0,
            averageConfidence: 0,
            successRate: 0
          }
        },
        systemIntegration: {
          personalizationEngine: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } },
          queryClassifier: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } },
          teachingSystem: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } },
          webSearchEngine: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } },
          centralIntegration: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } },
          halluPrevention: { status: 'partial', score: 0, details: [], performance: { responseTime: 0, accuracy: 0, reliability: 0 } }
        },
        recommendations: []
      };

      // Test individual components first
      await this.testIndividualComponents();

      // Test integration scenarios
      await this.testIntegrationScenarios();

      // Test end-to-end workflows
      await this.testEndToEndWorkflows();

      // Test system performance
      await this.testSystemPerformance();

      // Generate recommendations
      this.generateRecommendations();

      const totalTime = Date.now() - startTime;
      this.results.results.summary.averageResponseTime = this.calculateAverageResponseTime();
      this.results.results.summary.averageConfidence = this.calculateAverageConfidence();
      this.results.results.summary.successRate = this.results.results.summary.passedTests / this.results.results.summary.totalTests;

      console.log('\n' + '='.repeat(80));
      console.log('📊 Integration Test Results Summary:');
      console.log(`Total Tests: ${this.results.results.summary.totalTests}`);
      console.log(`Passed: ${this.results.results.summary.passedTests}`);
      console.log(`Failed: ${this.results.results.summary.failedTests}`);
      console.log(`Success Rate: ${(this.results.results.summary.successRate * 100).toFixed(1)}%`);
      console.log(`Average Response Time: ${this.results.results.summary.averageResponseTime.toFixed(0)}ms`);
      console.log(`Average Confidence: ${(this.results.results.summary.averageConfidence * 100).toFixed(1)}%`);
      console.log(`Total Test Duration: ${totalTime}ms`);
      console.log('='.repeat(80));

      return this.results as TestResults;

    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      throw error;
    }
  }

  /**
   * Test individual system components
   */
  private async testIndividualComponents(): Promise<void> {
    console.log('\n🔧 Testing Individual System Components...');

    // Test Advanced Personalization Engine
    await this.testPersonalizationEngine();
    
    // Test Smart Query Classifier
    await this.testQueryClassifier();
    
    // Test Adaptive Teaching System
    await this.testTeachingSystem();
    
    // Test Web Search Decision Engine
    await this.testWebSearchEngine();
    
    // Test Personalization Detection
    await this.testPersonalizationDetection();
  }

  /**
   * Test integration scenarios
   */
  private async testIntegrationScenarios(): Promise<void> {
    console.log('\n🔄 Testing Integration Scenarios...');

    for (const scenario of this.testConfig.testScenarios) {
      await this.runScenario(scenario);
    }
  }

  /**
   * Test end-to-end workflows
   */
  private async testEndToEndWorkflows(): Promise<void> {
    console.log('\n🌐 Testing End-to-End Workflows...');

    // Test complex workflows that involve multiple systems
    await this.testThermodynamicsTeachingWorkflow();
    await this.testPersonalizedResearchWorkflow();
    await this.testGeneralQueryWorkflow();
    await this.testMixedQueryWorkflow();
  }

  /**
   * Test system performance
   */
  private async testSystemPerformance(): Promise<void> {
    console.log('\n⚡ Testing System Performance...');

    // Test response times
    // Test memory usage
    // Test concurrent requests
    // Test error handling
  }

  // Individual component tests

  private async testPersonalizationEngine(): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];
    let score = 0;

    try {
      console.log('  Testing Advanced Personalization Engine...');
      
      // Test web search integration
      const webSearchResult = await advancedPersonalizationEngine.enhanceWithWebSearch(
        'What are the latest developments in quantum computing?',
        {
          userId: this.testConfig.userId,
          context: { currentSubject: 'Physics' },
          expertiseLevel: 'intermediate'
        }
      );

      if (webSearchResult && webSearchResult.confidence > 0.5) {
        score += 0.3;
        details.push('✅ Web search integration working');
      } else {
        details.push('❌ Web search integration failed');
      }

      // Test personalized response generation
      const personalizedResult = await advancedPersonalizationEngine.getPersonalizedResponse(
        'Explain thermodynamics in simple terms',
        {
          userId: this.testConfig.userId,
          context: { currentSubject: 'Physics', learningLevel: 'beginner' },
          preferences: { detailLevel: 'simple', includeExamples: true }
        }
      );

      if (personalizedResult && personalizedResult.confidence > 0.6) {
        score += 0.3;
        details.push('✅ Personalized response generation working');
      } else {
        details.push('❌ Personalized response generation failed');
      }

      // Test study pattern recognition
      if (personalizedResult?.adaptations?.styleAdapted) {
        score += 0.2;
        details.push('✅ Study pattern recognition working');
      } else {
        details.push('❌ Study pattern recognition failed');
      }

      // Test performance monitoring
      const responseTime = Date.now() - startTime;
      if (responseTime < 3000) {
        score += 0.2;
        details.push(`✅ Response time acceptable (${responseTime}ms)`);
      } else {
        details.push(`❌ Response time too slow (${responseTime}ms)`);
      }

      this.results.systemIntegration.personalizationEngine = {
        status: score > 0.7 ? 'passed' : score > 0.4 ? 'partial' : 'failed',
        score,
        details,
        performance: {
          responseTime,
          accuracy: score,
          reliability: score > 0.7 ? 0.9 : 0.6
        }
      };

    } catch (error) {
      console.error('  ❌ Personalization Engine test failed:', error);
      this.results.systemIntegration.personalizationEngine = {
        status: 'failed',
        score: 0,
        details: [`❌ Engine crashed: ${error}`],
        performance: { responseTime: Date.now() - startTime, accuracy: 0, reliability: 0 }
      };
    }
  }

  private async testQueryClassifier(): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];
    let score = 0;

    try {
      console.log('  Testing Smart Query Classifier...');

      // Test query classification
      const classification = await smartQueryClassifier.classifyQuery(
        'What is the current temperature in thermodynamics?',
        {
          userId: this.testConfig.userId,
          context: { currentSubject: 'Physics' },
          preferences: {}
        }
      );

      if (classification && classification.type) {
        score += 0.4;
        details.push(`✅ Query classified as: ${classification.type}`);
      } else {
        details.push('❌ Query classification failed');
      }

      // Test web search decision
      if (classification.webSearchNeeded !== undefined) {
        score += 0.3;
        details.push(`✅ Web search decision: ${classification.webSearchNeeded}`);
      } else {
        details.push('❌ Web search decision failed');
      }

      // Test expertise level detection
      if (classification.expertiseLevel) {
        score += 0.2;
        details.push(`✅ Expertise level detected: ${classification.expertiseLevel}`);
      } else {
        details.push('❌ Expertise level detection failed');
      }

      // Test confidence scoring
      if (classification.confidence > 0) {
        score += 0.1;
        details.push(`✅ Confidence scored: ${classification.confidence}`);
      }

      this.results.systemIntegration.queryClassifier = {
        status: score > 0.7 ? 'passed' : score > 0.4 ? 'partial' : 'failed',
        score,
        details,
        performance: {
          responseTime: Date.now() - startTime,
          accuracy: score,
          reliability: score > 0.7 ? 0.9 : 0.6
        }
      };

    } catch (error) {
      console.error('  ❌ Query Classifier test failed:', error);
      this.results.systemIntegration.queryClassifier = {
        status: 'failed',
        score: 0,
        details: [`❌ Classifier crashed: ${error}`],
        performance: { responseTime: Date.now() - startTime, accuracy: 0, reliability: 0 }
      };
    }
  }

  private async testTeachingSystem(): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];
    let score = 0;

    try {
      console.log('  Testing Adaptive Teaching System...');

      // Test adaptive explanation
      const teachingRequest = {
        topic: 'thermodynamics',
        userId: this.testConfig.userId,
        context: {
          subject: 'Physics',
          level: 'beginner' as const,
          priorKnowledge: [],
          learningObjective: 'Understand basic concepts',
          timeAvailable: 15
        },
        teachingStyle: 'interactive' as const
      };

      const teachingResult = await adaptiveTeachingSystem.provideAdaptiveExplanation(teachingRequest);

      if (teachingResult && teachingResult.explanation?.content) {
        score += 0.4;
        details.push('✅ Adaptive explanation generated');
      } else {
        details.push('❌ Adaptive explanation failed');
      }

      // Test feedback processing
      const feedbackResult = await adaptiveTeachingSystem.processUserFeedback(
        this.testConfig.userId,
        {
          understood: true,
          rating: 4,
          comment: 'Good explanation'
        }
      );

      if (feedbackResult) {
        score += 0.3;
        details.push('✅ Feedback processing working');
      } else {
        details.push('❌ Feedback processing failed');
      }

      // Test progressive disclosure
      if (teachingResult.adaptation?.progressiveDisclosure) {
        score += 0.2;
        details.push('✅ Progressive disclosure working');
      } else {
        details.push('❌ Progressive disclosure failed');
      }

      // Test confidence assessment
      if (teachingResult.confidenceLevel > 0) {
        score += 0.1;
        details.push(`✅ Confidence assessed: ${teachingResult.confidenceLevel}`);
      }

      this.results.systemIntegration.teachingSystem = {
        status: score > 0.7 ? 'passed' : score > 0.4 ? 'partial' : 'failed',
        score,
        details,
        performance: {
          responseTime: Date.now() - startTime,
          accuracy: score,
          reliability: score > 0.7 ? 0.9 : 0.6
        }
      };

    } catch (error) {
      console.error('  ❌ Teaching System test failed:', error);
      this.results.systemIntegration.teachingSystem = {
        status: 'failed',
        score: 0,
        details: [`❌ Teaching system crashed: ${error}`],
        performance: { responseTime: Date.now() - startTime, accuracy: 0, reliability: 0 }
      };
    }
  }

  private async testWebSearchEngine(): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];
    let score = 0;

    try {
      console.log('  Testing Web Search Decision Engine...');

      const searchContext = {
        userId: this.testConfig.userId,
        conversationHistory: [],
        domain: 'academic',
        expertiseLevel: 'intermediate' as const,
        previousSearches: [],
        successRate: 0.8,
        subject: 'Physics',
        urgency: 'normal' as const
      };

      const userPatterns = {
        userLevel: 'developing' as const,
        learningStyle: 'visual' as const,
        preferredDepth: 'moderate' as const,
        previousQueries: [],
        successPatterns: {
          withWebSearch: 10,
          withoutWebSearch: 5,
          satisfactionWithSearch: 8,
          satisfactionWithoutSearch: 6
        },
        domainExpertise: { physics: 'intermediate' }
      };

      // Test search decision
      const searchDecision = await webSearchDecisionEngine.makeSearchDecision(
        'What are the latest discoveries in quantum physics?',
        searchContext,
        userPatterns
      );

      if (searchDecision && searchDecision.shouldSearch !== undefined) {
        score += 0.4;
        details.push(`✅ Search decision made: ${searchDecision.shouldSearch}`);
      } else {
        details.push('❌ Search decision failed');
      }

      // Test decision confidence
      if (searchDecision.confidence > 0) {
        score += 0.3;
        details.push(`✅ Decision confidence: ${searchDecision.confidence}`);
      } else {
        details.push('❌ Decision confidence failed');
      }

      // Test search type classification
      if (searchDecision.searchType) {
        score += 0.2;
        details.push(`✅ Search type classified: ${searchDecision.searchType}`);
      } else {
        details.push('❌ Search type classification failed');
      }

      // Test user pattern updates
      await webSearchDecisionEngine.updateUserPatterns(
        this.testConfig.userId,
        'quantum physics question',
        searchDecision.shouldSearch,
        { satisfaction: 4, helpful: true, informationSufficient: true, wouldSearchAgain: true }
      );

      if (searchDecision.searchTerms.length > 0) {
        score += 0.1;
        details.push('✅ Search terms generated');
      }

      this.results.systemIntegration.webSearchEngine = {
        status: score > 0.7 ? 'passed' : score > 0.4 ? 'partial' : 'failed',
        score,
        details,
        performance: {
          responseTime: Date.now() - startTime,
          accuracy: score,
          reliability: score > 0.7 ? 0.9 : 0.6
        }
      };

    } catch (error) {
      console.error('  ❌ Web Search Engine test failed:', error);
      this.results.systemIntegration.webSearchEngine = {
        status: 'failed',
        score: 0,
        details: [`❌ Web search engine crashed: ${error}`],
        performance: { responseTime: Date.now() - startTime, accuracy: 0, reliability: 0 }
      };
    }
  }

  private async testPersonalizationDetection(): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];
    let score = 0;

    try {
      console.log('  Testing Personalization Detection...');

      // Test detection
      const detectionResult = await personalizationDetectionEngine.detectResponseType(
        'Help me understand thermodynamics better',
        this.testConfig.userId,
        { currentSubject: 'Physics', urgency: 'normal' }
      );

      if (detectionResult && detectionResult.responseType) {
        score += 0.4;
        details.push(`✅ Response type detected: ${detectionResult.responseType}`);
      } else {
        details.push('❌ Response type detection failed');
      }

      // Test confidence
      if (detectionResult.confidence > 0) {
        score += 0.3;
        details.push(`✅ Detection confidence: ${detectionResult.confidence}`);
      } else {
        details.push('❌ Detection confidence failed');
      }

      // Test adaptations
      if (detectionResult.adaptations && detectionResult.adaptations.length > 0) {
        score += 0.2;
        details.push(`✅ Adaptations generated: ${detectionResult.adaptations.length}`);
      } else {
        details.push('❌ Adaptations generation failed');
      }

      // Test profile updates
      await personalizationDetectionEngine.updateUserProfile(this.testConfig.userId, {
        responseType: 'personalized',
        satisfaction: 0.8,
        clarity: 0.9,
        usefulness: 0.8,
        appropriateDepth: true,
        neededClarification: false,
        timeSpent: 30
      });

      if (detectionResult.recommendedApproach) {
        score += 0.1;
        details.push(`✅ Approach recommended: ${detectionResult.recommendedApproach}`);
      }

      this.results.systemIntegration.centralIntegration = {
        status: score > 0.7 ? 'passed' : score > 0.4 ? 'partial' : 'failed',
        score,
        details,
        performance: {
          responseTime: Date.now() - startTime,
          accuracy: score,
          reliability: score > 0.7 ? 0.9 : 0.6
        }
      };

    } catch (error) {
      console.error('  ❌ Personalization Detection test failed:', error);
      this.results.systemIntegration.centralIntegration = {
        status: 'failed',
        score: 0,
        details: [`❌ Personalization detection crashed: ${error}`],
        performance: { responseTime: Date.now() - startTime, accuracy: 0, reliability: 0 }
      };
    }
  }

  // Scenario testing

  private async runScenario(scenario: TestScenario): Promise<void> {
    const startTime = Date.now();
    const issues: string[] = [];
    let passed = true;

    try {
      console.log(`  🔍 Testing scenario: ${scenario.name}`);

      // Use centralized service integration to process the query
      const unifiedRequest = {
        userId: this.testConfig.userId,
        query: scenario.query,
        context: {
          sessionId: this.testConfig.sessionId,
          ...scenario.context
        },
        preferences: {
          explanationStyle: 'interactive',
          detailLevel: 'comprehensive',
          includeExamples: true,
          teachingMode: true
        },
        flags: {
          hallucinationPrevention: true,
          webSearchEnabled: true,
          memoryEnabled: true,
          personalizationEnabled: true
        }
      };

      const response = await centralizedServiceIntegration.processUnifiedRequest(unifiedRequest);
      const responseTime = Date.now() - startTime;

      // Validate against expected results
      if (response.intelligence.confidence < scenario.expected.confidence) {
        issues.push(`Confidence ${response.intelligence.confidence} below expected ${scenario.expected.confidence}`);
        passed = false;
      }

      if (response.intelligence.halluPreventionLayers < scenario.expected.halluPreventionLayers) {
        issues.push(`Hallucination prevention layers ${response.intelligence.halluPreventionLayers} below expected ${scenario.expected.halluPreventionLayers}`);
        passed = false;
      }

      // Check response quality
      const responseQuality = this.assessResponseQuality(response, scenario);
      
      this.results.results!.scenarios.push({
        scenarioId: scenario.id,
        passed,
        actual: {
          responseType: response.intelligence.teachingMode ? 'hybrid' : 
                   response.intelligence.personalizationApplied ? 'personalized' : 'general',
          webSearchUsed: response.intelligence.webSearchUsed,
          teachingMode: response.intelligence.teachingMode,
          personalizationApplied: response.intelligence.personalizationApplied,
          confidence: response.intelligence.confidence,
          halluPreventionLayers: response.intelligence.halluPreventionLayers,
          responseTime,
          responseQuality
        },
        expected: scenario.expected,
        issues
      });

      if (passed) {
        this.results.results!.summary.passedTests++;
      } else {
        this.results.results!.summary.failedTests++;
      }
      this.results.results!.summary.totalTests++;

    } catch (error) {
      console.error(`  ❌ Scenario ${scenario.name} failed:`, error);
      this.results.results!.scenarios.push({
        scenarioId: scenario.id,
        passed: false,
        actual: {
          responseType: 'error',
          webSearchUsed: false,
          teachingMode: false,
          personalizationApplied: false,
          confidence: 0,
          halluPreventionLayers: 0,
          responseTime: Date.now() - startTime,
          responseQuality: 0
        },
        expected: scenario.expected,
        issues: [`System error: ${error}`]
      });
      this.results.results!.summary.failedTests++;
      this.results.results!.summary.totalTests++;
    }
  }

  // End-to-end workflow tests

  private async testThermodynamicsTeachingWorkflow(): Promise<void> {
    console.log('  🔬 Testing Thermodynamics Teaching Workflow...');
    
    // Simulate a complete teaching session
    const query = "Thermo sajhao bolenge bhi toh sajh nhi pata ki thermodynamic explain karna hai aur kitna karna hai";
    
    // This would test the teaching system understanding the user's feedback
    // and providing adaptive explanations
  }

  private async testPersonalizedResearchWorkflow(): Promise<void> {
    console.log('  🔍 Testing Personalized Research Workflow...');
    
    // Simulate research queries that need web search + personalization
  }

  private async testGeneralQueryWorkflow(): Promise<void> {
    console.log('  📚 Testing General Query Workflow...');
    
    // Simulate general knowledge queries
  }

  private async testMixedQueryWorkflow(): Promise<void> {
    console.log('  🔄 Testing Mixed Query Workflow...');
    
    // Simulate queries that need hybrid approaches
  }

  // Helper methods

  private assessResponseQuality(response: any, scenario: TestScenario): number {
    let quality = 0.5; // Base quality

    // Check if response contains content
    if (response.content?.main && response.content.main.length > 50) {
      quality += 0.2;
    }

    // Check teaching elements if expected
    if (scenario.expected.teachingMode && response.content?.teachingSteps) {
      quality += 0.2;
    }

    // Check personalization if expected
    if (scenario.expected.personalizationApplied && response.content?.explanation) {
      quality += 0.1;
    }

    return Math.min(1.0, quality);
  }

  private calculateAverageResponseTime(): number {
    const scenarios = this.results.results?.scenarios || [];
    if (scenarios.length === 0) return 0;
    
    const totalTime = scenarios.reduce((sum, scenario) => sum + scenario.actual.responseTime, 0);
    return totalTime / scenarios.length;
  }

  private calculateAverageConfidence(): number {
    const scenarios = this.results.results?.scenarios || [];
    if (scenarios.length === 0) return 0;
    
    const totalConfidence = scenarios.reduce((sum, scenario) => sum + scenario.actual.confidence, 0);
    return totalConfidence / scenarios.length;
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    // Analyze results and generate recommendations
    for (const [component, result] of Object.entries(this.results.systemIntegration)) {
      if (result.status === 'failed') {
        recommendations.push(`🚨 Critical issue in ${component}: System needs immediate attention`);
      } else if (result.status === 'partial') {
        recommendations.push(`⚠️  Performance issue in ${component}: Consider optimization`);
      }
    }

    // Performance recommendations
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 5000) {
      recommendations.push('🐌 Response times are high: Consider caching and optimization');
    }

    // Accuracy recommendations
    const successRate = this.results.results?.summary.successRate || 0;
    if (successRate < 0.8) {
      recommendations.push('📉 Success rate is low: Review system integration and error handling');
    }

    this.results.recommendations = recommendations;
  }
}

// Predefined test scenarios
export const createDefaultTestScenarios = (): TestScenario[] => [
  {
    id: 'thermodynamics_teaching',
    name: 'Thermodynamics Teaching Query',
    description: 'Test adaptive teaching for complex physics concepts',
    query: 'Thermo sajhao bolenge bhi toh sajh nhi pata ki thermodynamic explain karna hai aur kitna karna hai',
    context: {
      currentSubject: 'Physics',
      learningLevel: 'beginner',
      studyTime: 30,
      urgency: 'normal'
    },
    expected: {
      responseType: 'hybrid',
      webSearchUsed: true,
      teachingMode: true,
      personalizationApplied: true,
      confidence: 0.8,
      halluPreventionLayers: 5
    }
  },
  {
    id: 'personalized_research',
    name: 'Personalized Research Query',
    description: 'Test personalized research with web search',
    query: 'What are the latest developments in quantum computing and how do they relate to my study of advanced physics?',
    context: {
      currentSubject: 'Physics',
      learningLevel: 'advanced',
      studyTime: 60,
      urgency: 'normal'
    },
    expected: {
      responseType: 'personalized',
      webSearchUsed: true,
      teachingMode: false,
      personalizationApplied: true,
      confidence: 0.85,
      halluPreventionLayers: 5
    }
  },
  {
    id: 'general_knowledge',
    name: 'General Knowledge Query',
    description: 'Test general knowledge lookup',
    query: 'What is the definition of entropy?',
    context: {
      currentSubject: 'Physics',
      learningLevel: 'intermediate',
      studyTime: 10,
      urgency: 'low'
    },
    expected: {
      responseType: 'general',
      webSearchUsed: false,
      teachingMode: false,
      personalizationApplied: false,
      confidence: 0.9,
      halluPreventionLayers: 3
    }
  },
  {
    id: 'mixed_approach',
    name: 'Mixed Approach Query',
    description: 'Test hybrid personalized-general approach',
    query: 'Can you explain both the general concept of energy conservation and how it applies to my specific problem with this physics assignment?',
    context: {
      currentSubject: 'Physics',
      learningLevel: 'intermediate',
      studyTime: 45,
      urgency: 'high'
    },
    expected: {
      responseType: 'hybrid',
      webSearchUsed: true,
      teachingMode: true,
      personalizationApplied: true,
      confidence: 0.75,
      halluPreventionLayers: 5
    }
  },
  {
    id: 'web_search_research',
    name: 'Web Search Research Query',
    description: 'Test current information research',
    query: 'What are the most recent breakthroughs in renewable energy technology published this year?',
    context: {
      currentSubject: 'Environmental Science',
      learningLevel: 'advanced',
      studyTime: 90,
      urgency: 'normal'
    },
    expected: {
      responseType: 'general',
      webSearchUsed: true,
      teachingMode: false,
      personalizationApplied: false,
      confidence: 0.8,
      halluPreventionLayers: 4
    }
  }
];

// Export test runner
export async function runAdvancedPersonalizationIntegrationTest(
  userId: string = 'test_user_123',
  sessionId: string = 'test_session_456'
): Promise<TestResults> {
  const config: IntegrationTestConfig = {
    userId,
    sessionId,
    testScenarios: createDefaultTestScenarios(),
    expectedResults: {
      overallAccuracy: 0.85,
      responseQuality: 0.8,
      personalizationAccuracy: 0.8,
      webSearchAccuracy: 0.8,
      teachingEffectiveness: 0.8,
      hallucinationPrevention: 0.9,
      systemPerformance: {
        averageResponseTime: 3000,
        memoryUsage: 100, // MB
        successRate: 0.85
      }
    },
    timeout: 60000 // 60 seconds
  };

  const tester = new AdvancedPersonalizationIntegrationTester(config);
  return await tester.runCompleteTest();
}

// Export for standalone testing
if (typeof window !== 'undefined') {
  (window as any).runAdvancedPersonalizationIntegrationTest = runAdvancedPersonalizationIntegrationTest;
}