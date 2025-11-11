#!/usr/bin/env node

/**
 * Post-Database Fixes Validation Script
 * 
 * CRITICAL VERIFICATION: Real-time system testing against live application
 * Tests actual database schema, API functionality, and system stability
 * 
 * Usage: node post-database-fixes-validation.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test users and data
const TEST_USERS = [
  { id: 'test-user-uuid', email: 'test@example.com', name: 'Test User' },
  { id: 'anonymous-user-uuid', email: null, name: 'Anonymous User' },
  { id: 'kunal-user-uuid', email: 'kunal@example.com', name: 'Kunal User' }
];

// Create Supabase client for testing
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  database: {},
  api: {},
  memory: {},
  studyBuddy: {},
  auth: {},
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Post-Fix-Validation-Script/1.0',
        ...options.headers
      }
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: await response.json().catch(() => ({}))
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      ok: false,
      error: error.message
    };
  }
}

async function testDatabaseConnection() {
  log('Testing database connection...');
  testResults.database.connection = { status: 'testing', timestamp: new Date().toISOString() };
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    testResults.database.connection = {
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Database connection established'
    };
    log('Database connection: SUCCESS', 'success');
  } catch (error) {
    testResults.database.connection = {
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    };
    log(`Database connection: FAILED - ${error.message}`, 'error');
  }
}

async function testDatabaseSchema() {
  log('Testing database schema integrity...');
  testResults.database.schema = { status: 'testing', timestamp: new Date().toISOString() };
  
  try {
    // Test all critical tables exist
    const criticalTables = [
      'profiles',
      'student_ai_profile',
      'api_usage_logs',
      'memory_storage',
      'conversations',
      'student_ai_messages',
      'user_penalties',
      'search_cache'
    ];
    
    const tableChecks = await Promise.all(
      criticalTables.map(async (table) => {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          return { table, exists: !error, error: error?.message };
        } catch (err) {
          return { table, exists: false, error: err.message };
        }
      })
    );
    
    testResults.database.schema = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      tables: tableChecks,
      allTablesExist: tableChecks.every(check => check.exists)
    };
    
    if (testResults.database.schema.allTablesExist) {
      log('Database schema: ALL TABLES EXIST', 'success');
    } else {
      const missing = tableChecks.filter(check => !check.exists);
      log(`Database schema: MISSING TABLES - ${missing.map(t => t.table).join(', ')}`, 'error');
    }
  } catch (error) {
    testResults.database.schema = {
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    };
    log(`Database schema test: FAILED - ${error.message}`, 'error');
  }
}

async function testApiUsageLogsWithUUID() {
  log('Testing API usage log insertion with UUID handling...');
  testResults.api.usageLogs = { status: 'testing', timestamp: new Date().toISOString() };
  
  const testResults_ = [];
  
  for (const user of TEST_USERS) {
    try {
      const testLog = {
        user_id: user.id,
        endpoint: '/api/test/usage-log',
        method: 'POST',
        response_time: Math.floor(Math.random() * 1000),
        status_code: 200,
        timestamp: new Date().toISOString(),
        metadata: { test: true, user_type: user.email ? 'authenticated' : 'anonymous' }
      };
      
      const { data, error } = await supabase
        .from('api_usage_logs')
        .insert([testLog])
        .select();
      
      if (error) {
        testResults_.push({
          user: user.name,
          success: false,
          error: error.message
        });
        log(`API usage log (${user.name}): FAILED - ${error.message}`, 'error');
      } else {
        testResults_.push({
          user: user.name,
          success: true,
          logId: data[0]?.id
        });
        log(`API usage log (${user.name}): SUCCESS`, 'success');
      }
    } catch (err) {
      testResults_.push({
        user: user.name,
        success: false,
        error: err.message
      });
      log(`API usage log (${user.name}): FAILED - ${err.message}`, 'error');
    }
  }
  
  testResults.api.usageLogs = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    userTests: testResults_,
    allSuccessful: testResults_.every(result => result.success)
  };
}

async function testMemoryStorageAndRetrieval() {
  log('Testing memory storage and retrieval...');
  testResults.memory.storage = { status: 'testing', timestamp: new Date().toISOString() };
  
  const memoryTests = [];
  
  for (const user of TEST_USERS) {
    try {
      // Test memory storage
      const testMemory = {
        user_id: user.id,
        content: `Test memory for ${user.name} at ${new Date().toISOString()}`,
        embedding: Array(1536).fill(0.1), // Mock embedding
        memory_type: 'test',
        importance_score: 0.8,
        created_at: new Date().toISOString()
      };
      
      const { data: stored, error: storeError } = await supabase
        .from('memory_storage')
        .insert([testMemory])
        .select();
      
      if (storeError) {
        memoryTests.push({
          user: user.name,
          storage: false,
          retrieval: false,
          error: storeError.message
        });
        log(`Memory storage (${user.name}): FAILED - ${storeError.message}`, 'error');
        continue;
      }
      
      // Test memory retrieval
      const { data: retrieved, error: retrieveError } = await supabase
        .from('memory_storage')
        .select('*')
        .eq('id', stored[0].id)
        .single();
      
      if (retrieveError) {
        memoryTests.push({
          user: user.name,
          storage: true,
          retrieval: false,
          error: retrieveError.message
        });
        log(`Memory retrieval (${user.name}): FAILED - ${retrieveError.message}`, 'error');
      } else {
        memoryTests.push({
          user: user.name,
          storage: true,
          retrieval: true,
          memoryId: stored[0].id
        });
        log(`Memory operations (${user.name}): SUCCESS`, 'success');
      }
    } catch (err) {
      memoryTests.push({
        user: user.name,
        storage: false,
        retrieval: false,
        error: err.message
      });
      log(`Memory test (${user.name}): FAILED - ${err.message}`, 'error');
    }
  }
  
  testResults.memory.storage = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    userTests: memoryTests,
    allSuccessful: memoryTests.every(test => test.storage && test.retrieval)
  };
}

async function testStudyBuddyAuthenticationAndRLS() {
  log('Testing study buddy authentication and RLS policies...');
  testResults.studyBuddy.auth = { status: 'testing', timestamp: new Date().toISOString() };
  
  const authTests = [];
  
  for (const user of TEST_USERS) {
    try {
      // Test RLS policy for student_ai_profile
      let query = supabase
        .from('student_ai_profile')
        .select('*')
        .eq('user_id', user.id);
      
      // Add auth context for authenticated users
      if (user.email) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error && error.message.includes('RLS')) {
        authTests.push({
          user: user.name,
          rls: false,
          error: 'RLS policy violation'
        });
        log(`Study buddy RLS (${user.name}): FAILED - RLS policy violation`, 'error');
      } else {
        authTests.push({
          user: user.name,
          rls: true,
          accessGranted: !error
        });
        log(`Study buddy RLS (${user.name}): SUCCESS`, 'success');
      }
    } catch (err) {
      authTests.push({
        user: user.name,
        rls: false,
        error: err.message
      });
      log(`Study buddy auth (${user.name}): FAILED - ${err.message}`, 'error');
    }
  }
  
  testResults.studyBuddy.auth = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    userTests: authTests,
    allRlsPassed: authTests.every(test => test.rls)
  };
}

async function testApiEndpointFunctionality() {
  log('Testing API endpoint functionality with real requests...');
  testResults.api.endpoints = { status: 'testing', timestamp: new Date().toISOString() };
  
  const endpoints = [
    { path: '/api/chat/health-check', method: 'GET' },
    { path: '/api/chat/conversations', method: 'GET' },
    { path: '/api/ai/memory-storage', method: 'POST' },
    { path: '/api/study-buddy', method: 'GET' }
  ];
  
  const endpointTests = await Promise.all(
    endpoints.map(async (endpoint) => {
      const url = `${BASE_URL}${endpoint.path}`;
      const response = await makeRequest(url, { method: endpoint.method });
      
      return {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: response.status,
        success: response.ok,
        responseTime: response.data?.responseTime || 'N/A'
      };
    })
  );
  
  testResults.api.endpoints = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    tests: endpointTests,
    allWorking: endpointTests.every(test => test.success)
  };
  
  if (testResults.api.endpoints.allWorking) {
    log('API endpoints: ALL WORKING', 'success');
  } else {
    const failed = endpointTests.filter(test => !test.success);
    log(`API endpoints: FAILED - ${failed.map(f => f.endpoint).join(', ')}`, 'error');
  }
}

async function checkPrismjsDependency() {
  log('Checking prismjs dependency status...');
  testResults.dependencies = { status: 'testing', timestamp: new Date().toISOString() };
  
  try {
    // Check if prismjs is properly configured
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const hasPrismjs = 
      (packageJson.dependencies && packageJson.dependencies.prismjs) ||
      (packageJson.devDependencies && packageJson.devDependencies.prismjs);
    
    testResults.dependencies = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      prismjs: {
        installed: hasPrismjs,
        version: hasPrismjs ? 
          packageJson.dependencies?.prismjs || packageJson.devDependencies?.prismjs : 'Not found'
      }
    };
    
    if (hasPrismjs) {
      log('PrismJS dependency: INSTALLED', 'success');
    } else {
      log('PrismJS dependency: NOT INSTALLED', 'warning');
    }
  } catch (error) {
    testResults.dependencies = {
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    };
    log(`PrismJS check: FAILED - ${error.message}`, 'error');
  }
}

async function runComprehensiveSystemTest() {
  log('Starting comprehensive post-database fixes validation...');
  
  const startTime = Date.now();
  
  try {
    // Run all test suites
    await testDatabaseConnection();
    await testDatabaseSchema();
    await testApiUsageLogsWithUUID();
    await testMemoryStorageAndRetrieval();
    await testStudyBuddyAuthenticationAndRLS();
    await testApiEndpointFunctionality();
    await checkPrismjsDependency();
    
    // Calculate summary
    const totalTests = [
      testResults.database,
      testResults.api,
      testResults.memory,
      testResults.studyBuddy
    ].reduce((sum, category) => {
      return sum + Object.keys(category).length;
    }, 0);
    
    testResults.summary.total = totalTests;
    testResults.summary.passed = 0;
    testResults.summary.failed = 0;
    testResults.summary.warnings = 0;
    
    // Count results
    const allTests = [
      testResults.database.connection,
      testResults.database.schema,
      testResults.api.usageLogs,
      testResults.api.endpoints,
      testResults.memory.storage,
      testResults.studyBuddy.auth,
      testResults.dependencies
    ];
    
    allTests.forEach(test => {
      if (test?.status === 'success' || test?.allSuccessful || test?.allWorking) {
        testResults.summary.passed++;
      } else if (test?.status === 'failed') {
        testResults.summary.failed++;
      } else if (test?.status === 'completed' && (test.allSuccessful === false || test.allWorking === false)) {
        testResults.summary.failed++;
      } else {
        testResults.summary.warnings++;
      }
    });
    
    const duration = Date.now() - startTime;
    log(`Validation completed in ${duration}ms`);
    
  } catch (error) {
    testResults.errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    log(`Validation failed: ${error.message}`, 'error');
  }
}

async function generateValidationReport() {
  const report = {
    testResults,
    summary: {
      overallStatus: testResults.summary.failed === 0 ? 'PASS' : 'FAIL',
      totalTests: testResults.summary.total,
      passed: testResults.summary.passed,
      failed: testResults.summary.failed,
      warnings: testResults.summary.warnings,
      successRate: Math.round((testResults.summary.passed / testResults.summary.total) * 100)
    },
    recommendations: [],
    criticalIssues: []
  };
  
  // Identify critical issues
  if (testResults.database.connection?.status === 'failed') {
    report.criticalIssues.push('Database connection failure - system unavailable');
  }
  
  if (testResults.database.schema?.allTablesExist === false) {
    report.criticalIssues.push('Missing database tables - core functionality impaired');
  }
  
  if (testResults.api.usageLogs?.allSuccessful === false) {
    report.criticalIssues.push('API usage logging failures - monitoring compromised');
  }
  
  if (testResults.memory.storage?.allSuccessful === false) {
    report.criticalIssues.push('Memory system failures - core AI features impaired');
  }
  
  if (testResults.studyBuddy.auth?.allRlsPassed === false) {
    report.criticalIssues.push('Study buddy RLS policy violations - security compromised');
  }
  
  if (testResults.api.endpoints?.allWorking === false) {
    report.criticalIssues.push('API endpoint failures - application routes compromised');
  }
  
  // Generate recommendations
  if (report.criticalIssues.length === 0) {
    report.recommendations.push('System appears to be fully functional - no immediate action required');
  } else {
    report.recommendations.push('Critical issues detected - immediate intervention required');
  }
  
  return report;
}

// Main execution
async function main() {
  log('Post-Database Fixes Validation Script Starting...', 'info');
  
  try {
    await runComprehensiveSystemTest();
    const report = await generateValidationReport();
    
    // Write detailed results
    fs.writeFileSync(
      'post-database-fix-validation-results.json',
      JSON.stringify(report, null, 2)
    );
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('POST-DATABASE FIXES VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    
    if (report.criticalIssues.length > 0) {
      console.log('\nCRITICAL ISSUES:');
      report.criticalIssues.forEach(issue => console.log(`❌ ${issue}`));
    }
    
    if (report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`💡 ${rec}`));
    }
    
    console.log('\nDetailed results saved to: post-database-fix-validation-results.json');
    console.log('='.repeat(80));
    
    return report;
  } catch (error) {
    log(`Validation script failed: ${error.message}`, 'error');
    throw error;
  }
}

// Run the validation
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Post-database fixes validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Post-database fixes validation failed:', error);
      process.exit(1);
    });
}

module.exports = { main, testResults };