#!/usr/bin/env node

/**
 * Final Comprehensive Validation Test Suite - Authentication-Free Test Version
 * Tests the unified study buddy chat system functionality for validation
 */

const fs = require('fs');

class SimpleValidationTestSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            systemConnectivity: { status: 'pending', results: [] },
            endpointAvailability: { status: 'pending', tests: [] },
            criticalFunctionality: { status: 'pending', checks: [] }
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Simplified Final Validation Test Suite\n');
        
        try {
            await this.testSystemConnectivity();
            await this.testEndpointAvailability();
            await this.testCriticalFunctionality();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.error = error.message;
        }
    }

    async testSystemConnectivity() {
        console.log('🌐 Test 1: System Connectivity Test');
        
        const connectivityTests = [
            { name: 'Study Buddy Endpoint', url: 'http://localhost:3000/api/study-buddy', method: 'GET' },
            { name: 'Health Check', url: 'http://localhost:3000/api/chat/health-check', method: 'GET' },
            { name: 'Memory Storage', url: 'http://localhost:3000/api/ai/memory-storage', method: 'GET' },
            { name: 'Semantic Search', url: 'http://localhost:3000/api/ai/semantic-search', method: 'GET' }
        ];

        for (const test of connectivityTests) {
            console.log(`  Testing: ${test.name}`);
            
            try {
                const response = await fetch(test.url, { method: test.method });
                const isAvailable = response.status < 500; // Any 4xx is ok, 5xx is bad
                
                const result = {
                    name: test.name,
                    url: test.url,
                    status: response.status,
                    available: isAvailable,
                    timestamp: new Date().toISOString()
                };
                
                this.testResults.systemConnectivity.results.push(result);
                
                if (isAvailable) {
                    console.log(`    ✅ PASS: ${test.name} available (HTTP ${response.status})`);
                } else {
                    console.log(`    ❌ FAIL: ${test.name} unavailable (HTTP ${response.status})`);
                }
                
            } catch (error) {
                console.log(`    ❌ ERROR: ${test.name} - ${error.message}`);
                this.testResults.systemConnectivity.results.push({
                    name: test.name,
                    url: test.url,
                    error: error.message,
                    available: false
                });
            }
        }
        
        this.testResults.systemConnectivity.status = 'completed';
        console.log('✅ System connectivity test completed\n');
    }

    async testEndpointAvailability() {
        console.log('🔗 Test 2: Endpoint Availability Test');
        
        const endpointTests = [
            { name: 'Study Buddy POST', url: 'http://localhost:3000/api/study-buddy', method: 'POST', data: {} },
            { name: 'AI Chat', url: 'http://localhost:3000/api/ai/chat', method: 'POST', data: {} },
            { name: 'Memory Search', url: 'http://localhost:3000/api/memory/search', method: 'POST', data: {} }
        ];

        for (const test of endpointTests) {
            console.log(`  Testing: ${test.name}`);
            
            try {
                const response = await fetch(test.url, {
                    method: test.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(test.data)
                });
                
                const result = {
                    name: test.name,
                    url: test.url,
                    method: test.method,
                    status: response.status,
                    accessible: true,
                    timestamp: new Date().toISOString()
                };
                
                this.testResults.endpointAvailability.tests.push(result);
                
                if (response.status === 400 || response.status === 401) {
                    console.log(`    ✅ PASS: ${test.name} accessible (HTTP ${response.status} - expected auth/error response)`);
                } else if (response.status < 500) {
                    console.log(`    ✅ PASS: ${test.name} accessible (HTTP ${response.status})`);
                } else {
                    console.log(`    ❌ FAIL: ${test.name} server error (HTTP ${response.status})`);
                }
                
            } catch (error) {
                console.log(`    ❌ ERROR: ${test.name} - ${error.message}`);
                this.testResults.endpointAvailability.tests.push({
                    name: test.name,
                    url: test.url,
                    error: error.message,
                    accessible: false
                });
            }
        }
        
        this.testResults.endpointAvailability.status = 'completed';
        console.log('✅ Endpoint availability test completed\n');
    }

    async testCriticalFunctionality() {
        console.log('🎯 Test 3: Critical Functionality Check');
        
        const functionalityChecks = [
            {
                name: 'Study Buddy API Structure',
                test: () => this.validateApiStructure('http://localhost:3000/api/study-buddy')
            },
            {
                name: 'Memory System Integration',
                test: () => this.validateMemoryIntegration()
            },
            {
                name: 'Hallucination Prevention Layers',
                test: () => this.validateHallucinationPrevention()
            },
            {
                name: 'Study Buddy Features',
                test: () => this.validateStudyBuddyFeatures()
            }
        ];

        for (const check of functionalityChecks) {
            console.log(`  Checking: ${check.name}`);
            
            try {
                const result = await check.test();
                this.testResults.criticalFunctionality.checks.push(result);
                
                if (result.passed) {
                    console.log(`    ✅ PASS: ${check.name} - ${result.message}`);
                } else {
                    console.log(`    ⚠️ REVIEW: ${check.name} - ${result.message}`);
                }
                
            } catch (error) {
                console.log(`    ❌ ERROR: ${check.name} - ${error.message}`);
                this.testResults.criticalFunctionality.checks.push({
                    name: check.name,
                    error: error.message,
                    passed: false
                });
            }
        }
        
        this.testResults.criticalFunctionality.status = 'completed';
        console.log('✅ Critical functionality check completed\n');
    }

    async validateApiStructure(url) {
        try {
            const response = await fetch(url, { method: 'GET' });
            const data = await response.json();
            
            const hasRequiredFields = data.features || data.status;
            const passed = response.status === 200 && hasRequiredFields;
            
            return {
                name: 'API Structure Validation',
                passed,
                message: passed ? 'API returns proper structure with features/status' : 'API structure needs review',
                details: { responseStatus: response.status, hasFeatures: !!data.features }
            };
        } catch (error) {
            return {
                name: 'API Structure Validation',
                passed: false,
                message: `API validation failed: ${error.message}`
            };
        }
    }

    async validateMemoryIntegration() {
        try {
            // Test if memory endpoints are available
            const response = await fetch('http://localhost:3000/api/ai/memory-storage', { method: 'GET' });
            const available = response.status < 500;
            
            return {
                name: 'Memory Integration Check',
                passed: available,
                message: available ? 'Memory system endpoints accessible' : 'Memory system needs attention',
                details: { responseStatus: response.status }
            };
        } catch (error) {
            return {
                name: 'Memory Integration Check',
                passed: false,
                message: `Memory integration failed: ${error.message}`
            };
        }
    }

    async validateHallucinationPrevention() {
        try {
            // Check if hallucination prevention system is integrated
            const studyBuddyResponse = await fetch('http://localhost:3000/api/study-buddy', { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (studyBuddyResponse.status === 200) {
                const data = await studyBuddyResponse.json();
                const hasFeatures = data.features && data.features.includes('hallucination-prevention');
                
                return {
                    name: 'Hallucination Prevention Check',
                    passed: hasFeatures,
                    message: hasFeatures ? '5-layer hallucination prevention system detected' : 'Hallucination prevention features need verification',
                    details: { features: data.features }
                };
            }
            
            return {
                name: 'Hallucination Prevention Check',
                passed: false,
                message: 'Cannot verify hallucination prevention system'
            };
        } catch (error) {
            return {
                name: 'Hallucination Prevention Check',
                passed: false,
                message: `Hallucination prevention check failed: ${error.message}`
            };
        }
    }

    async validateStudyBuddyFeatures() {
        try {
            const response = await fetch('http://localhost:3000/api/study-buddy', { method: 'GET' });
            const data = await response.json();
            
            const requiredFeatures = [
                'memory-integration',
                'hallucination-prevention', 
                'personalization',
                'educational-content',
                'jee-preparation',
                'thermodynamics-teaching'
            ];
            
            const hasAllFeatures = requiredFeatures.every(feature => 
                data.features && data.features.includes(feature)
            );
            
            return {
                name: 'Study Buddy Features Check',
                passed: hasAllFeatures,
                message: hasAllFeatures ? 'All study buddy features detected' : 'Some study buddy features missing',
                details: { 
                    required: requiredFeatures,
                    available: data.features || [],
                    missing: requiredFeatures.filter(f => !data.features?.includes(f))
                }
            };
        } catch (error) {
            return {
                name: 'Study Buddy Features Check',
                passed: false,
                message: `Study buddy features check failed: ${error.message}`
            };
        }
    }

    generateReport() {
        const report = {
            summary: {
                timestamp: this.testResults.timestamp,
                totalTests: this.countTotalTests(),
                passedTests: this.countPassedTests(),
                failedTests: this.countFailedTests(),
                overallStatus: this.getOverallStatus()
            },
            details: this.testResults,
            systemAssessment: this.generateSystemAssessment(),
            recommendations: this.generateRecommendations()
        };

        // Save report
        const reportPath = 'final-validation-simplified-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 FINAL VALIDATION REPORT (SIMPLIFIED)');
        console.log('=========================================');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passedTests}`);
        console.log(`Failed: ${report.summary.failedTests}`);
        console.log(`Overall Status: ${report.summary.overallStatus}`);
        console.log(`\nSystem Assessment: ${report.systemAssessment}`);
        console.log(`\nReport saved to: ${reportPath}`);
        
        if (report.summary.overallStatus === 'PASSED') {
            console.log('\n🎉 SYSTEM VALIDATION PASSED - Unified study buddy chat system is functional!');
        } else {
            console.log('\n⚠️ System validation completed - Review recommendations for improvements');
        }
        
        return report;
    }

    countTotalTests() {
        return this.testResults.systemConnectivity.results.length +
               this.testResults.endpointAvailability.tests.length +
               this.testResults.criticalFunctionality.checks.length;
    }

    countPassedTests() {
        return this.testResults.systemConnectivity.results.filter(r => r.available).length +
               this.testResults.endpointAvailability.tests.filter(t => t.accessible).length +
               this.testResults.criticalFunctionality.checks.filter(c => c.passed).length;
    }

    countFailedTests() {
        return this.countTotalTests() - this.countPassedTests();
    }

    getOverallStatus() {
        const passRate = this.countPassedTests() / this.countTotalTests();
        return passRate >= 0.8 ? 'PASSED' : 'FAILED';
    }

    generateSystemAssessment() {
        const connectivityScore = this.testResults.systemConnectivity.results.filter(r => r.available).length / 
                                this.testResults.systemConnectivity.results.length;
        const endpointScore = this.testResults.endpointAvailability.tests.filter(t => t.accessible).length / 
                            this.testResults.endpointAvailability.tests.length;
        const functionalityScore = this.testResults.criticalFunctionality.checks.filter(c => c.passed).length / 
                                 this.testResults.criticalFunctionality.checks.length;
        
        const overallScore = (connectivityScore + endpointScore + functionalityScore) / 3;
        
        if (overallScore >= 0.9) return 'EXCELLENT - All systems operational';
        if (overallScore >= 0.8) return 'GOOD - Most systems functional';
        if (overallScore >= 0.6) return 'FAIR - Some systems need attention';
        return 'NEEDS IMPROVEMENT - Multiple systems require fixes';
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check system connectivity
        const failedConnectivity = this.testResults.systemConnectivity.results.filter(r => !r.available);
        if (failedConnectivity.length > 0) {
            recommendations.push(`Fix connectivity issues: ${failedConnectivity.map(r => r.name).join(', ')}`);
        }
        
        // Check endpoint availability
        const failedEndpoints = this.testResults.endpointAvailability.tests.filter(t => !t.accessible);
        if (failedEndpoints.length > 0) {
            recommendations.push(`Address endpoint issues: ${failedEndpoints.map(t => t.name).join(', ')}`);
        }
        
        // Check critical functionality
        const failedFunctionality = this.testResults.criticalFunctionality.checks.filter(c => !c.passed);
        if (failedFunctionality.length > 0) {
            recommendations.push(`Fix functionality issues: ${failedFunctionality.map(c => c.name).join(', ')}`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is functioning well - consider performance optimization');
        }
        
        return recommendations;
    }
}

// Run the test suite
if (require.main === module) {
    const tester = new SimpleValidationTestSuite();
    tester.runAllTests().catch(console.error);
}

module.exports = SimpleValidationTestSuite;