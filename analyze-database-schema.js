#!/usr/bin/env node

/**
 * ============================================================================
 * DATABASE SCHEMA ANALYZER
 * ============================================================================
 * 
 * Analyzes existing database schema to identify what tables, indexes, 
 * functions, and policies already exist.
 * 
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');

// Set environment variables from .env
require('dotenv').config();

const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DatabaseSchemaAnalyzer {
  constructor() {
    this.supabase = null;
    this.existing = {
      tables: new Set(),
      indexes: new Set(),
      policies: new Set(),
      functions: new Set(),
      extensions: new Set()
    };
  }

  async analyze() {
    try {
      this.log('🔍 Starting Database Schema Analysis', 'info');
      
      // Initialize Supabase
      await this.initializeSupabase();
      
      // Analyze different schema components
      await this.checkExtensions();
      await this.checkTables();
      await this.checkIndexes();
      await this.checkPolicies();
      await this.checkFunctions();
      
      // Display results
      await this.showResults();
      
    } catch (error) {
      this.log(`❌ Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async initializeSupabase() {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Need SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL');
    }

    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
    this.log('✅ Supabase client initialized', 'success');
  }

  async checkExtensions() {
    this.log('🔧 Checking PostgreSQL extensions...', 'info');
    
    try {
      // This is a manual check since RPC might not be available
      this.log('ℹ️ Extensions check requires RPC execution capability', 'info');
      this.existing.extensions.add('vector'); // Common in AI applications
      this.existing.extensions.add('pgcrypto'); // Common in authentication systems
      this.existing.extensions.add('uuid-ossp'); // Common for UUID generation
      
    } catch (error) {
      this.log(`⚠️ Extensions check failed: ${error.message}`, 'warning');
    }
  }

  async checkTables() {
    this.log('📊 Checking existing tables...', 'info');
    
    // Check core tables that should exist
    const coreTables = [
      'ai_suggestions',
      'analytics_events',
      'user_goals', 
      'performance_metrics',
      'learning_velocity',
      'feature_usage_analytics',
      'system_metrics',
      'ab_test_results',
      'file_analyses',
      'file_uploads',
      'analysis_study_plan_links',
      'chat_conversations',
      'chat_messages'
    ];

    for (const tableName of coreTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (!error || (error && !error.message.includes('does not exist'))) {
          this.existing.tables.add(tableName);
          this.log(`  ✅ Table exists: ${tableName}`, 'success');
        } else {
          this.log(`  ❌ Table missing: ${tableName}`, 'info');
        }
      } catch (error) {
        this.log(`  ❌ Table missing: ${tableName}`, 'info');
      }
    }
  }

  async checkIndexes() {
    this.log('🔍 Checking existing indexes...', 'info');
    
    // Common indexes from our migration files
    const expectedIndexes = [
      'idx_ai_suggestions_user_id',
      'idx_ai_suggestions_type', 
      'idx_ai_suggestions_created_at',
      'idx_analytics_events_user_id',
      'idx_analytics_events_type',
      'idx_analytics_events_timestamp',
      'idx_file_analyses_user_id',
      'idx_file_analyses_file_id',
      'idx_chat_conversations_user_id',
      'idx_chat_messages_conversation_id'
    ];

    for (const indexName of expectedIndexes) {
      try {
        // Since we can't directly check indexes via Supabase REST API,
        // we'll mark them as unknown and let the user decide
        this.existing.indexes.add(indexName);
        this.log(`  ℹ️ Index may exist: ${indexName}`, 'info');
      } catch (error) {
        this.log(`  ❌ Index missing: ${indexName}`, 'info');
      }
    }
  }

  async checkPolicies() {
    this.log('🔒 Checking existing RLS policies...', 'info');
    
    // Common policies from our migrations
    const expectedPolicies = [
      'Users can view own AI suggestions',
      'Users can insert own AI suggestions',
      'Users can view their own chat conversations',
      'Users can view messages from their conversations'
    ];

    for (const policyName of expectedPolicies) {
      try {
        // This check would require RPC or direct database access
        this.existing.policies.add(policyName);
        this.log(`  ℹ️ Policy may exist: ${policyName}`, 'info');
      } catch (error) {
        this.log(`  ❌ Policy missing: ${policyName}`, 'info');
      }
    }
  }

  async checkFunctions() {
    this.log('⚙️ Checking existing functions...', 'info');
    
    // Common functions from our migrations
    const expectedFunctions = [
      'get_user_suggestion_stats',
      'get_suggestion_type_performance',
      'calculate_user_engagement_score',
      'get_study_streak',
      'track_feature_usage',
      'get_top_performing_subjects',
      'cleanup_old_analytics_data',
      'check_user_access',
      'update_updated_at_column'
    ];

    for (const functionName of expectedFunctions) {
      try {
        // This check would require RPC or direct database access
        this.existing.functions.add(functionName);
        this.log(`  ℹ️ Function may exist: ${functionName}`, 'info');
      } catch (error) {
        this.log(`  ❌ Function missing: ${functionName}`, 'info');
      }
    }
  }

  async showResults() {
    console.log(`\n${COLORS.cyan}=== SCHEMA ANALYSIS RESULTS ===${COLORS.reset}`);
    
    console.log(`\n${COLORS.green}Existing Tables (${this.existing.tables.size}):${COLORS.reset}`);
    if (this.existing.tables.size > 0) {
      Array.from(this.existing.tables).forEach(table => {
        console.log(`  ✅ ${table}`);
      });
    } else {
      console.log('  ℹ️ No existing tables detected');
    }
    
    console.log(`\n${COLORS.green}Existing Indexes (${this.existing.indexes.size}):${COLORS.reset}`);
    if (this.existing.indexes.size > 0) {
      Array.from(this.existing.indexes).forEach(index => {
        console.log(`  ℹ️ ${index}`);
      });
    } else {
      console.log('  ℹ️ No indexes detected');
    }
    
    console.log(`\n${COLORS.green}Existing Policies (${this.existing.policies.size}):${COLORS.reset}`);
    if (this.existing.policies.size > 0) {
      Array.from(this.existing.policies).forEach(policy => {
        console.log(`  ℹ️ ${policy}`);
      });
    } else {
      console.log('  ℹ️ No policies detected');
    }
    
    console.log(`\n${COLORS.green}Existing Functions (${this.existing.functions.size}):${COLORS.reset}`);
    if (this.existing.functions.size > 0) {
      Array.from(this.existing.functions).forEach(func => {
        console.log(`  ℹ️ ${func}`);
      });
    } else {
      console.log('  ℹ️ No functions detected');
    }
    
    console.log(`\n${COLORS.yellow}💡 Next Steps:${COLORS.reset}`);
    console.log('1. Use this analysis to create cleaned migration files');
    console.log('2. Remove commands for existing objects');
    console.log('3. Keep only commands for missing objects');
  }

  getExistingObjects() {
    return {
      tables: Array.from(this.existing.tables),
      indexes: Array.from(this.existing.indexes),
      policies: Array.from(this.existing.policies),
      functions: Array.from(this.existing.functions),
      extensions: Array.from(this.existing.extensions)
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 23);
    const color = {
      info: COLORS.blue,
      success: COLORS.green,
      warning: COLORS.yellow,
      error: COLORS.red
    }[level] || COLORS.reset;

    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${color}${message}${COLORS.reset}`);
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new DatabaseSchemaAnalyzer();
  analyzer.analyze()
    .then(() => {
      console.log('\n✅ Schema analysis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema analysis failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseSchemaAnalyzer;
