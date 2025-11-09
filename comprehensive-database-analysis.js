#!/usr/bin/env node

/**
 * Comprehensive Database Table Analysis
 * Identifies all table references in code vs actual database schema
 * Special focus on log tables and missing tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

// All table references found in codebase (from search results)
const CODE_TABLES = [
  // Core tables (from database.types.ts)
  'subjects', 'chapters', 'topics', 'blocks', 'feedback', 'activity_logs',
  'daily_activity_summary', 'user_gamification', 'sessions', 'pomodoro_templates',
  'points_history', 'user_badges', 'user_gdrive_credentials', 'revision_topics',
  'resources', 'revision_queue', 'user_penalties', 'profiles', 'chat_conversations',
  'chat_messages', 'study_chat_memory', 'memory_summaries', 'student_ai_profile',
  'api_usage_logs', 'ai_system_prompts',
  
  // AI & Analytics tables (frequently used in logs)
  'study_sessions', 'questions_attempted', 'user_goals', 'analytics_events',
  'ai_suggestions', 'mistral_analyses',
  
  // Hallucination prevention tables
  'knowledge_base', 'knowledge_sources', 'conversation_memory', 'confidence_scores',
  'context_optimization_logs', 'quality_metrics', 'learning_results', 'recognized_patterns',
  'response_contradictions', 'response_validations', 'personalization_results',
  
  // User management tables
  'student_profiles', 'student_performance', 'user_profiles', 'user_feedback',
  'user_memories', 'implicit_feedback',
  
  // File & resource management
  'file_analyses', 'file_uploads', 'notes',
  
  // Gamification & achievement system
  'achievement_progress',
  
  // Background jobs & system
  'backup_metadata', 'cache_events', 'daily_usage_reports',
  'suggestion_generation_logs', 'suggestion_interactions'
];

class DatabaseAnalyzer {
  constructor() {
    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    this.results = {
      existing: [],
      missing: [],
      errors: []
    };
  }

  /**
   * Get all existing tables from database
   */
  async getExistingTables() {
    try {
      console.log('🔍 Fetching existing database tables...');
      
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (error) throw error;
      
      const existingTables = data.map(row => row.table_name);
      console.log(`✅ Found ${existingTables.length} existing tables`);
      return existingTables;
      
    } catch (error) {
      this.results.errors.push(`Failed to fetch tables: ${error.message}`);
      return [];
    }
  }

  /**
   * Test specific table access
   */
  async testTableAccess(tableName) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return { exists: !error, error: error?.message || null };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * Analyze all tables from codebase
   */
  async analyzeAllTables() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔬 COMPREHENSIVE DATABASE TABLE ANALYSIS');
    console.log(`${'='.repeat(60)}\n`);
    
    const existingTables = await this.getExistingTables();
    
    console.log('📊 Testing access to all referenced tables...\n');
    
    // Test each table from codebase
    for (const tableName of CODE_TABLES) {
      process.stdout.write(`Testing: ${tableName}... `);
      
      const isExisting = existingTables.includes(tableName);
      
      if (isExisting) {
        // Test access
        const accessResult = await this.testTableAccess(tableName);
        if (accessResult.exists) {
          console.log('✅ EXISTS & ACCESSIBLE');
          this.results.existing.push(tableName);
        } else {
          console.log('⚠️  EXISTS BUT NOT ACCESSIBLE');
          this.results.missing.push({ table: tableName, reason: 'access_denied', error: accessResult.error });
        }
      } else {
        console.log('❌ MISSING');
        this.results.missing.push({ table: tableName, reason: 'not_found' });
      }
    }
    
    this.showResults();
  }

  /**
   * Show analysis results
   */
  showResults() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 ANALYSIS RESULTS');
    console.log(`${'='.repeat(60)}\n`);
    
    // Existing tables
    console.log(`${'🟢 EXISTING TABLES (' + this.results.existing.length + '):'}`);
    this.results.existing.forEach(table => console.log(`  ✅ ${table}`));
    
    // Missing tables
    console.log(`\n${'🔴 MISSING TABLES (' + this.results.missing.length + '):'}`);
    this.results.missing.forEach(item => {
      const reason = item.reason === 'access_denied' ? '(access denied)' : '(not found)';
      console.log(`  ❌ ${item.table} ${reason}`);
      if (item.error) console.log(`      Error: ${item.error}`);
    });
    
    // Critical missing tables (especially logs)
    const criticalMissing = this.results.missing.filter(item => 
      item.table.includes('log') || 
      item.table.includes('memory') ||
      item.table.includes('analytics') ||
      item.table.includes('knowledge') ||
      item.table.includes('conversation') ||
      item.table.includes('activity') ||
      item.table.includes('quality') ||
      item.table.includes('suggestion')
    );
    
    if (criticalMissing.length > 0) {
      console.log(`\n${'🚨 CRITICAL MISSING LOG TABLES (' + criticalMissing.length + '):'}`);
      criticalMissing.forEach(item => {
        console.log(`  💥 ${item.table} - ${item.reason === 'access_denied' ? 'exists but not accessible' : 'completely missing'}`);
        if (item.error) console.log(`      Error: ${item.error}`);
      });
    }
    
    // Generate migration for missing tables
    this.generateMissingTablesMigration();
  }

  /**
   * Generate SQL migration for missing tables
   */
  generateMissingTablesMigration() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔧 GENERATING MIGRATION FOR MISSING TABLES');
    console.log(`${'='.repeat(60)}\n`);
    
    const criticalTables = [
      // Log & Analytics tables
      {
        name: 'study_sessions',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          subject TEXT,
          chapter TEXT,
          duration_minutes INTEGER DEFAULT 0,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          is_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        `,
        index: 'CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);'
      },
      {
        name: 'questions_attempted',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
          subject TEXT NOT NULL,
          chapter TEXT,
          is_correct BOOLEAN NOT NULL,
          attempted_at TIMESTAMPTZ DEFAULT NOW(),
          time_taken_seconds INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        `,
        index: 'CREATE INDEX idx_questions_attempted_user_id ON questions_attempted(user_id);'
      },
      {
        name: 'user_goals',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'subject', 'chapter')),
          target_value INTEGER NOT NULL,
          current_value INTEGER DEFAULT 0,
          target_date DATE,
          is_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        `,
        index: 'CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);'
      },
      {
        name: 'analytics_events',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          event_category TEXT NOT NULL,
          event_type TEXT NOT NULL,
          event_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        `,
        index: 'CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);'
      },
      {
        name: 'ai_suggestions',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          suggestion_type TEXT NOT NULL,
          suggestion_text TEXT NOT NULL,
          context_data JSONB,
          is_viewed BOOLEAN DEFAULT false,
          is_accepted BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        `,
        index: 'CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);'
      }
    ];
    
    console.log('📝 CRITICAL TABLES MIGRATION SQL:');
    console.log('-- Copy and execute in Supabase SQL Editor\n');
    
    criticalTables.forEach(table => {
      console.log(`-- Table: ${table.name}`);
      console.log(`CREATE TABLE IF NOT EXISTS public.${table.name} (`);
      console.log(table.columns.trim());
      console.log(');');
      console.log(table.index);
      console.log('');
    });
    
    console.log('\n💡 For the complete list of missing tables, check the results above.');
    console.log('🎯 Priority: Focus on log tables first (activity_logs already exists)');
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new DatabaseAnalyzer();
  analyzer.analyzeAllTables().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseAnalyzer;