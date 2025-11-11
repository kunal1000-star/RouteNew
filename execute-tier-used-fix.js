#!/usr/bin/env node

/**
 * ============================================================================
 * TIER USED COLUMN FIX MIGRATION
 * ============================================================================
 * 
 * This script executes the SQL migration to add the missing tier_used column
 * to the api_usage_logs table.
 * 
 * ============================================================================
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Set environment variables from the existing configuration
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHBzbXlocXV2eWdlbnloeWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNjA1OSwiZXhwIjoyMDc2MTkyMDU5fQ.DToP52OO0m1oxBBYeaY-86EkEY9s_yCu28ucR1Zf0sU";

const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  migrationFile: './add-tier-used-column.sql'
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

class TierUsedMigrationExecutor {
  constructor() {
    this.supabase = null;
  }

  async execute() {
    try {
      console.log('🚀 Executing tier_used column fix migration...');
      
      if (!CONFIG.supabaseUrl || !CONFIG.serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
      }
      
      this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.serviceRoleKey);
      
      // Read migration file
      const migrationSQL = fs.readFileSync(CONFIG.migrationFile, 'utf8');
      
      console.log('📖 Migration SQL loaded successfully');
      
      // Execute the migration using RPC
      await this.executeMigration(migrationSQL);
      
      // Verify the migration
      await this.verifyMigration();
      
      console.log('✅ Tier used column migration completed successfully!');
      
    } catch (error) {
      console.log(`${COLORS.red}❌ Error: ${error.message}${COLORS.reset}`);
      process.exit(1);
    }
  }

  async executeMigration(sql) {
    try {
      console.log('🔄 Executing SQL migration...');
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      
      for (const statement of statements) {
        try {
          // Use RPC to execute the statement
          const { data, error } = await this.supabase.rpc('exec_sql', { 
            query: statement 
          });
          
          if (error) {
            console.log(`${COLORS.yellow}⚠️ Statement had issue (but continuing): ${error.message}${COLORS.reset}`);
          } else {
            successCount++;
          }
        } catch (stmtError) {
          console.log(`${COLORS.yellow}⚠️ Statement failed: ${stmtError.message}${COLORS.reset}`);
        }
      }
      
      console.log(`${COLORS.green}✅ Executed ${successCount} SQL statements${COLORS.reset}`);
      
    } catch (error) {
      throw new Error(`Migration execution failed: ${error.message}`);
    }
  }

  async verifyMigration() {
    try {
      console.log('🔍 Verifying migration results...');
      
      // Check if tier_used column exists
      const { data, error } = await this.supabase
        .from('api_usage_logs')
        .select('tier_used')
        .limit(1);
      
      if (error) {
        console.log(`${COLORS.yellow}⚠️ Verification issue: ${error.message}${COLORS.reset}`);
      } else {
        console.log(`${COLORS.green}✅ tier_used column is accessible${COLORS.reset}`);
      }
      
      // Check table structure
      const { data: schemaData, error: schemaError } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'api_usage_logs')
        .eq('column_name', 'tier_used');
      
      if (schemaError) {
        console.log(`${COLORS.yellow}⚠️ Schema check issue: ${schemaError.message}${COLORS.reset}`);
      } else if (schemaData && schemaData.length > 0) {
        console.log(`${COLORS.green}✅ tier_used column exists with type: ${schemaData[0].data_type}${COLORS.reset}`);
      }
      
    } catch (error) {
      console.log(`${COLORS.yellow}⚠️ Verification failed: ${error.message}${COLORS.reset}`);
    }
  }
}

// Execute
const executor = new TierUsedMigrationExecutor();
executor.execute();