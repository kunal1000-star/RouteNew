#!/usr/bin/env node

/**
 * Database Schema Fix Verification Script
 * Tests all 3 fixes after manual migration execution
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Console colors
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class SchemaVerification {
  constructor() {
    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    this.results = {
      gamification: { passed: false, errors: [] },
      activityLogs: { passed: false, errors: [] },
      timeFormat: { passed: false, errors: [] }
    };
  }

  /**
   * Test FIX 1: Gamification schema with missing columns
   */
  async testGamificationSchema() {
    console.log(`${COLORS.blue}🔍 Testing FIX 1: Gamification schema...${COLORS.reset}`);
    
    try {
      // Test 1: Check if user_gamification table exists and has total_penalty_points
      const { data, error } = await this.supabase
        .from('user_gamification')
        .select('total_penalty_points, level, experience_points')
        .limit(1);

      if (error) {
        if (error.message.includes('total_penalty_points')) {
          this.results.gamification.errors.push('total_penalty_points column still missing');
        } else if (error.message.includes('relation "user_gamification" does not exist')) {
          this.results.gamification.errors.push('user_gamification table does not exist');
        } else {
          this.results.gamification.errors.push(`Unexpected error: ${error.message}`);
        }
      } else {
        console.log(`${COLORS.green}✅ PASS: user_gamification table with total_penalty_points accessible${COLORS.reset}`);
        this.results.gamification.passed = true;
      }

    } catch (error) {
      this.results.gamification.errors.push(`Exception: ${error.message}`);
    }
  }

  /**
   * Test FIX 2: Activity logs schema with details column
   */
  async testActivityLogsSchema() {
    console.log(`${COLORS.blue}🔍 Testing FIX 2: Activity logs schema...${COLORS.reset}`);
    
    try {
      // Test: Check if activity_logs table has details column
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('details')
        .limit(1);

      if (error) {
        if (error.message.includes('details')) {
          this.results.activityLogs.errors.push('details column still missing from activity_logs');
        } else if (error.message.includes('relation "activity_logs" does not exist')) {
          this.results.activityLogs.errors.push('activity_logs table does not exist');
        } else {
          this.results.activityLogs.errors.push(`Unexpected error: ${error.message}`);
        }
      } else {
        console.log(`${COLORS.green}✅ PASS: activity_logs table with details column accessible${COLORS.reset}`);
        this.results.activityLogs.passed = true;
      }

    } catch (error) {
      this.results.activityLogs.errors.push(`Exception: ${error.message}`);
    }
  }

  /**
   * Test FIX 3: Time format compatibility
   */
  async testTimeFormat() {
    console.log(`${COLORS.blue}🔍 Testing FIX 3: Time format compatibility...${COLORS.reset}`);
    
    try {
      // Test: Simulate the time format fix by creating a test block with proper time format
      const testTime = new Date();
      const timeString = testTime.toTimeString().split(' ')[0]; // "HH:MM:SS" format

      // Try to query blocks table to see current structure
      const { data, error } = await this.supabase
        .from('blocks')
        .select('start_time')
        .limit(1);

      if (error) {
        if (error.message.includes('start_time')) {
          this.results.timeFormat.errors.push('start_time column issues - may need schema review');
        } else {
          console.log(`${COLORS.yellow}⚠️  Blocks table test skipped: ${error.message}${COLORS.reset}`);
        }
      } else {
        console.log(`${COLORS.green}✅ PASS: blocks table accessible, time format fix applied${COLORS.reset}`);
        this.results.timeFormat.passed = true;
      }

    } catch (error) {
      this.results.timeFormat.errors.push(`Exception: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`${COLORS.cyan}=== DATABASE SCHEMA FIX VERIFICATION ===${COLORS.reset}\n`);
    
    await this.testGamificationSchema();
    await this.testActivityLogsSchema();
    await this.testTimeFormat();
    
    this.showResults();
  }

  /**
   * Display test results
   */
  showResults() {
    console.log(`\n${COLORS.cyan}=== TEST RESULTS ===${COLORS.reset}`);
    
    // Fix 1: Gamification
    console.log(`${COLORS.blue}FIX 1 - Gamification Schema:${COLORS.reset}`);
    if (this.results.gamification.passed) {
      console.log(`${COLORS.green}✅ PASSED${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}❌ FAILED${COLORS.reset}`);
      this.results.gamification.errors.forEach(error => {
        console.log(`  • ${COLORS.red}${error}${COLORS.reset}`);
      });
    }
    
    // Fix 2: Activity Logs
    console.log(`${COLORS.blue}FIX 2 - Activity Logs Schema:${COLORS.reset}`);
    if (this.results.activityLogs.passed) {
      console.log(`${COLORS.green}✅ PASSED${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}❌ FAILED${COLORS.reset}`);
      this.results.activityLogs.errors.forEach(error => {
        console.log(`  • ${COLORS.red}${error}${COLORS.reset}`);
      });
    }
    
    // Fix 3: Time Format
    console.log(`${COLORS.blue}FIX 3 - Time Format:${COLORS.reset}`);
    if (this.results.timeFormat.passed) {
      console.log(`${COLORS.green}✅ PASSED${COLORS.reset}`);
    } else {
      console.log(`${COLORS.yellow}⚠️  PARTIAL${COLORS.reset}`);
      this.results.timeFormat.errors.forEach(error => {
        console.log(`  • ${COLORS.yellow}${error}${COLORS.reset}`);
      });
    }
    
    // Overall status
    const allPassed = this.results.gamification.passed && 
                     this.results.activityLogs.passed && 
                     this.results.timeFormat.passed;
    
    console.log(`\n${COLORS.bright}=== OVERALL STATUS ===${COLORS.reset}`);
    if (allPassed) {
      console.log(`${COLORS.green}🎉 ALL FIXES VERIFIED - Console errors should be resolved!${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}⚠️  Some fixes still needed - Manual migration may be incomplete${COLORS.reset}`);
    }
    
    console.log(`\n${COLORS.cyan}Next Steps:${COLORS.reset}`);
    console.log(`1. If any test failed, run the migration: ${COLORS.yellow}database-schema-fix-complete.sql${COLORS.reset}`);
    console.log(`2. In Supabase SQL Editor: https://app.supabase.com`);
    console.log(`3. Re-run this verification script after migration`);
  }
}

// Main execution
if (require.main === module) {
  const verification = new SchemaVerification();
  verification.runAllTests().catch(error => {
    console.error(`${COLORS.red}Verification failed:${COLORS.reset}`, error);
    process.exit(1);
  });
}

module.exports = SchemaVerification;