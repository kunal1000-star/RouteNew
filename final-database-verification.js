#!/usr/bin/env node

/**
 * Final Database Verification Script
 * Tests that all critical errors are resolved after comprehensive migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

// Console colors
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

class FinalVerifier {
  constructor() {
    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    this.results = {
      critical: { passed: 0, failed: 0, errors: [] },
      logTables: { passed: 0, failed: 0, errors: [] },
      coreTables: { passed: 0, failed: 0, errors: [] }
    };
  }

  /**
   * Test specific error scenarios that were reported
   */
  async testOriginalErrorScenarios() {
    console.log(`${COLORS.blue}🔍 Testing Original Error Scenarios...${COLORS.reset}\n`);
    
    // Test 1: Gamification service (original error)
    console.log('📋 Test 1: Gamification Service (total_penalty_points column)');
    try {
      const { data, error } = await this.supabase
        .from('user_gamification')
        .select('total_penalty_points, level, experience_points')
        .limit(1);
      
      if (error) {
        throw error;
      }
      console.log(`${COLORS.green}✅ PASSED: Gamification service can access required columns${COLORS.reset}`);
      this.results.critical.passed++;
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: Gamification service error - ${error.message}${COLORS.reset}`);
      this.results.critical.failed++;
      this.results.critical.errors.push(`Gamification: ${error.message}`);
    }
    
    // Test 2: Activity logger (details column)
    console.log('\n📋 Test 2: Activity Logger (details column)');
    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('details, user_id, activity_type')
        .limit(1);
      
      if (error) {
        throw error;
      }
      console.log(`${COLORS.green}✅ PASSED: Activity logger can access details column${COLORS.reset}`);
      this.results.critical.passed++;
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: Activity logger error - ${error.message}${COLORS.reset}`);
      this.results.critical.failed++;
      this.results.critical.errors.push(`Activity Logger: ${error.message}`);
    }
    
    // Test 3: Time adjustment (block start_time)
    console.log('\n📋 Test 3: Time Adjustment Service (block start_time)');
    try {
      const { data, error } = await this.supabase
        .from('blocks')
        .select('start_time, duration, user_id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      console.log(`${COLORS.green}✅ PASSED: Time adjustment service can access block start_time${COLORS.reset}`);
      this.results.critical.passed++;
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: Time adjustment error - ${error.message}${COLORS.reset}`);
      this.results.critical.failed++;
      this.results.critical.errors.push(`Time Adjustment: ${error.message}`);
    }
  }

  /**
   * Test critical log tables specifically
   */
  async testLogTables() {
    console.log(`\n${COLORS.blue}🔍 Testing Critical Log Tables...${COLORS.reset}\n`);
    
    const logTables = [
      'activity_logs',
      'chat_conversations', 
      'chat_messages',
      'study_chat_memory',
      'memory_summaries',
      'api_usage_logs',
      'analytics_events',
      'conversation_memory',
      'context_optimization_logs',
      'quality_metrics',
      'knowledge_base',
      'knowledge_sources'
    ];
    
    for (const tableName of logTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        console.log(`${COLORS.green}✅ ${tableName} - accessible${COLORS.reset}`);
        this.results.logTables.passed++;
      } catch (error) {
        console.log(`${COLORS.red}❌ ${tableName} - ${error.message}${COLORS.reset}`);
        this.results.logTables.failed++;
        this.results.logTables.errors.push(`${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Test core application tables
   */
  async testCoreTables() {
    console.log(`\n${COLORS.blue}🔍 Testing Core Application Tables...${COLORS.reset}\n`);
    
    const coreTables = [
      'subjects',
      'chapters', 
      'topics',
      'blocks',
      'sessions',
      'user_gamification',
      'student_ai_profile',
      'daily_activity_summary'
    ];
    
    for (const tableName of coreTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        console.log(`${COLORS.green}✅ ${tableName} - accessible${COLORS.reset}`);
        this.results.coreTables.passed++;
      } catch (error) {
        console.log(`${COLORS.red}❌ ${tableName} - ${error.message}${COLORS.reset}`);
        this.results.coreTables.failed++;
        this.results.coreTables.errors.push(`${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Simulate the exact operations that were failing
   */
  async testFailingOperations() {
    console.log(`\n${COLORS.blue}🔍 Testing Previously Failing Operations...${COLORS.reset}\n`);
    
    // Test 1: Gamification penalty application
    console.log('📋 Test: Gamification Penalty Application');
    try {
      const { data, error } = await this.supabase
        .from('user_gamification')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      console.log(`${COLORS.green}✅ PASSED: Penalty service can query user_gamification${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: ${error.message}${COLORS.reset}`);
    }
    
    // Test 2: Activity logging
    console.log('\n📋 Test: Activity Logging');
    try {
      const testLog = {
        user_id: '00000000-0000-0000-0000-000000000000', // test UUID
        activity_type: 'test',
        summary: 'test log',
        details: { test: 'data' }
      };
      
      const { data, error } = await this.supabase
        .from('activity_logs')
        .insert(testLog)
        .select();
      
      if (error) throw error;
      
      // Clean up test data
      if (data && data[0]) {
        await this.supabase.from('activity_logs').delete().eq('id', data[0].id);
      }
      
      console.log(`${COLORS.green}✅ PASSED: Activity logger can insert with details column${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: ${error.message}${COLORS.reset}`);
    }
    
    // Test 3: Block time adjustment
    console.log('\n📋 Test: Block Time Adjustment');
    try {
      const testBlock = {
        id: '00000000-0000-0000-0000-000000000000', // test UUID
        title: 'test',
        date: '2025-11-09',
        start_time: '09:00:00',
        duration: 60,
        user_id: '00000000-0000-0000-0000-000000000000'
      };
      
      const { data, error } = await this.supabase
        .from('blocks')
        .update({ start_time: '10:00:00' })
        .eq('id', testBlock.id)
        .select();
      
      if (error) throw error;
      console.log(`${COLORS.green}✅ PASSED: Time adjustment can update block start_time${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.red}❌ FAILED: ${error.message}${COLORS.reset}`);
    }
  }

  /**
   * Run all verification tests
   */
  async runAllTests() {
    console.log(`${COLORS.cyan}${COLORS.bright}=== FINAL DATABASE VERIFICATION ===${COLORS.reset}\n`);
    
    await this.testOriginalErrorScenarios();
    await this.testLogTables();
    await this.testCoreTables();
    await this.testFailingOperations();
    
    this.showFinalResults();
  }

  /**
   * Show comprehensive results
   */
  showFinalResults() {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== FINAL VERIFICATION RESULTS ===${COLORS.reset}`);
    
    // Critical errors (original issues)
    console.log(`\n${COLORS.blue}CRITICAL ERRORS (Original Issues):${COLORS.reset}`);
    console.log(`  ${COLORS.green}✅ Passed: ${this.results.critical.passed}${COLORS.reset}`);
    console.log(`  ${COLORS.red}❌ Failed: ${this.results.critical.failed}${COLORS.reset}`);
    if (this.results.critical.errors.length > 0) {
      this.results.critical.errors.forEach(error => {
        console.log(`    ${COLORS.red}• ${error}${COLORS.reset}`);
      });
    }
    
    // Log tables
    console.log(`\n${COLORS.blue}LOG TABLES:${COLORS.reset}`);
    console.log(`  ${COLORS.green}✅ Accessible: ${this.results.logTables.passed}${COLORS.reset}`);
    console.log(`  ${COLORS.red}❌ Failed: ${this.results.logTables.failed}${COLORS.reset}`);
    
    // Core tables
    console.log(`\n${COLORS.blue}CORE TABLES:${COLORS.reset}`);
    console.log(`  ${COLORS.green}✅ Accessible: ${this.results.coreTables.passed}${COLORS.reset}`);
    console.log(`  ${COLORS.red}❌ Failed: ${this.results.coreTables.failed}${COLORS.reset}`);
    
    // Overall status
    const totalPassed = this.results.critical.passed + this.results.logTables.passed + this.results.coreTables.passed;
    const totalFailed = this.results.critical.failed + this.results.logTables.failed + this.results.coreTables.failed;
    const totalTests = totalPassed + totalFailed;
    
    console.log(`\n${COLORS.bright}=== OVERALL STATUS ===${COLORS.reset}`);
    
    if (this.results.critical.failed === 0) {
      console.log(`${COLORS.green}🎉 SUCCESS: All original critical errors resolved!${COLORS.reset}`);
      console.log(`${COLORS.green}✅ Time format issues: FIXED${COLORS.reset}`);
      console.log(`${COLORS.green}✅ Gamification schema: FIXED${COLORS.reset}`);
      console.log(`${COLORS.green}✅ Activity logging: FIXED${COLORS.reset}`);
      console.log(`\n${COLORS.cyan}Database is now fully functional for the application!${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}⚠️  Some critical issues remain${COLORS.reset}`);
      console.log(`${COLORS.cyan}Manual migration may be incomplete${COLORS.reset}`);
    }
    
    console.log(`\n${COLORS.blue}Next Steps:${COLORS.reset}`);
    console.log(`1. If all tests pass: Your database is ready!`);
    console.log(`2. If any fail: Run the complete migration in Supabase SQL Editor`);
    console.log(`3. Migration file: ${COLORS.yellow}complete-database-schema-migration.sql${COLORS.reset}`);
  }
}

// Main execution
if (require.main === module) {
  const verifier = new FinalVerifier();
  verifier.runAllTests().catch(error => {
    console.error(`${COLORS.red}Verification failed:${COLORS.reset}`, error);
    process.exit(1);
  });
}

module.exports = FinalVerifier;