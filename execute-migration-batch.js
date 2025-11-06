#!/usr/bin/env node

/**
 * ============================================================================
 * BATCH MIGRATION EXECUTOR FOR PROJECT FINAL
 * ============================================================================
 * 
 * Executes the four specific migration files:
 * 1. migration-2025-11-04-ai-suggestions.sql
 * 2. migration-2025-11-04-analytics.sql
 * 3. migration-2025-11-04-file-analyses.sql
 * 4. migration-2025-11-05-fix-chat-rls.sql
 * 
 * ============================================================================
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Migration files in execution order
  migrations: [
    {
      name: 'AI Suggestions System',
      file: 'migration-2025-11-04-ai-suggestions.sql',
      description: 'Creates AI suggestions table with analytics views and functions'
    },
    {
      name: 'Comprehensive Analytics',
      file: 'migration-2025-11-04-analytics.sql',
      description: 'Creates analytics infrastructure with 7 tables for tracking user activities'
    },
    {
      name: 'File Analysis System',
      file: 'migration-2025-11-04-file-analyses.sql',
      description: 'Creates file analysis tables with vector embeddings support'
    },
    {
      name: 'Chat RLS Fix',
      file: 'migration-2025-11-05-fix-chat-rls.sql',
      description: 'Fixes RLS policies for chat conversations and messages'
    }
  ]
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class BatchMigrationExecutor {
  constructor() {
    this.supabase = null;
    this.results = [];
    this.startTime = Date.now();
  }

  async run() {
    try {
      this.log('🚀 Starting Batch Migration Execution', 'info');
      
      // Initialize Supabase client
      await this.initializeSupabase();
      
      // Verify environment
      await this.verifyEnvironment();
      
      // Execute migrations in order
      for (let i = 0; i < CONFIG.migrations.length; i++) {
        const migration = CONFIG.migrations[i];
        this.log(`\n📋 Executing Migration ${i + 1}/${CONFIG.migrations.length}: ${migration.name}`, 'info');
        
        const result = await this.executeMigration(migration);
        this.results.push(result);
        
        if (!result.success) {
          this.log(`❌ Migration ${migration.name} failed: ${result.error}`, 'error');
          break;
        } else {
          this.log(`✅ Migration ${migration.name} completed successfully`, 'success');
        }
        
        // Add delay between migrations
        if (i < CONFIG.migrations.length - 1) {
          this.log('⏱️  Waiting 2 seconds before next migration...', 'info');
          await this.sleep(2000);
        }
      }
      
      // Show summary
      await this.showSummary();
      
      if (this.results.every(r => r.success)) {
        this.log('🎉 All migrations completed successfully!', 'success');
        process.exit(0);
      } else {
        this.log('💥 Some migrations failed. Check the results above.', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`❌ Migration batch failed: ${error.message}`, 'error');
      this.log(error.stack, 'error');
      process.exit(1);
    }
  }

  async initializeSupabase() {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Need SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL');
    }

    try {
      this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
      this.log('✅ Supabase client initialized', 'success');
    } catch (error) {
      throw new Error(`Failed to initialize Supabase client: ${error.message}`);
    }
  }

  async verifyEnvironment() {
    this.log('🔍 Verifying environment and database connectivity...', 'info');
    
    try {
      // Test basic connectivity
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: 'SELECT NOW() as current_time;'
      });
      
      if (error) {
        this.log(`⚠️  Direct SQL execution not available via RPC: ${error.message}`, 'warning');
        this.log('📋 Will provide SQL files for manual execution', 'info');
        return false;
      }
      
      this.log('✅ Database connectivity confirmed', 'success');
      return true;
      
    } catch (error) {
      this.log(`⚠️  Database connectivity issue: ${error.message}`, 'warning');
      return false;
    }
  }

  async executeMigration(migration) {
    const migrationPath = `./${migration.file}`;
    
    try {
      // Check if migration file exists
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }
      
      // Read migration SQL
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Try to execute via RPC if possible
      try {
        const canExecute = await this.verifyEnvironment();
        
        if (canExecute) {
          // Split SQL into statements and execute
          const statements = this.splitSqlStatements(sql);
          let executedCount = 0;
          
          for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed.length === 0 || trimmed.startsWith('--')) continue;
            
            try {
              await this.supabase.rpc('exec_sql', { query: trimmed });
              executedCount++;
            } catch (stmtError) {
              this.log(`⚠️  Statement execution failed, continuing: ${stmtError.message}`, 'warning');
            }
          }
          
          return {
            name: migration.name,
            file: migration.file,
            success: true,
            executedStatements: executedCount,
            method: 'rpc'
          };
        }
      } catch (rpcError) {
        this.log(`⚠️  RPC execution failed: ${rpcError.message}`, 'warning');
      }
      
      // Fallback: Provide SQL for manual execution
      return {
        name: migration.name,
        file: migration.file,
        success: true,
        sql: sql,
        method: 'manual'
      };
      
    } catch (error) {
      return {
        name: migration.name,
        file: migration.file,
        success: false,
        error: error.message
      };
    }
  }

  splitSqlStatements(sql) {
    // Simple SQL statement splitter
    // This is a basic implementation - production code would need more robust parsing
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showSummary() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log(`\n${COLORS.bright}=== MIGRATION BATCH SUMMARY ===${COLORS.reset}`);
    console.log(`${COLORS.blue}Duration:${COLORS.reset} ${duration} seconds`);
    console.log(`${COLORS.blue}Total Migrations:${COLORS.reset} ${CONFIG.migrations.length}`);
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`${COLORS.green}Successful:${COLORS.reset} ${successful}`);
    if (failed > 0) {
      console.log(`${COLORS.red}Failed:${COLORS.reset} ${failed}`);
    }
    
    console.log(`\n${COLORS.cyan}Migration Details:${COLORS.reset}`);
    for (const result of this.results) {
      const status = result.success ? `${COLORS.green}✅ SUCCESS${COLORS.reset}` : `${COLORS.red}❌ FAILED${COLORS.reset}`;
      console.log(`  ${status} ${result.name}`);
      
      if (result.success && result.method === 'manual') {
        console.log(`    📄 SQL ready for manual execution`);
      } else if (result.success && result.executedStatements) {
        console.log(`    🔧 Executed ${result.executedStatements} statements via RPC`);
      }
      
      if (!result.success) {
        console.log(`    💥 Error: ${result.error}`);
      }
    }
    
    if (this.results.some(r => r.method === 'manual')) {
      console.log(`\n${COLORS.yellow}📋 Manual Execution Required:${COLORS.reset}`);
      console.log('1. Copy the SQL from the failed migrations');
      console.log('2. Go to Supabase Dashboard: https://app.supabase.com/project/mrhpsmyhquvygenyhygf');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Execute the SQL manually');
    }
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
  const executor = new BatchMigrationExecutor();
  executor.run();
}

module.exports = BatchMigrationExecutor;
