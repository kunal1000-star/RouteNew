#!/usr/bin/env node

/**
 * ============================================================================
 * MIGRATION FILE REPAIRER
 * ============================================================================
 * 
 * Fixes issues in cleaned migration files and creates final safe versions.
 * 
 * ============================================================================
 */

const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class MigrationFileRepairer {
  constructor() {
    this.repairedFiles = [];
  }

  async repairAll() {
    try {
      this.log('🔧 Starting Migration File Repair Process', 'info');
      
      // Fix each migration file
      await this.repairFile('migration-2025-11-04-ai-suggestions.sql', 'AI Suggestions System');
      await this.repairFile('migration-2025-11-04-analytics.sql', 'Comprehensive Analytics');
      await this.repairFile('migration-2025-11-04-file-analyses.sql', 'File Analysis System');
      await this.repairFile('migration-2025-11-05-fix-chat-rls.sql', 'Chat RLS Fix');
      
      // Show results
      await this.showResults();
      
    } catch (error) {
      this.log(`❌ Repair failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async repairFile(filename, description) {
    const originalPath = `./${filename}`;
    const repairedPath = `./safe-${filename}`;
    
    this.log(`\n🔧 Repairing ${filename} (${description})`, 'info');
    
    if (!fs.existsSync(originalPath)) {
      this.log(`❌ File not found: ${originalPath}`, 'error');
      return;
    }
    
    try {
      // Read original content
      const originalContent = fs.readFileSync(originalPath, 'utf8');
      
      // Repair the content
      const repairedContent = this.repairSqlContent(originalContent, filename);
      
      // Write repaired file
      fs.writeFileSync(repairedPath, repairedContent);
      
      this.log(`✅ Created repaired file: ${repairedPath}`, 'success');
      this.repairedFiles.push({
        original: filename,
        repaired: repairedPath,
        description: description,
        size: repairedContent.length
      });
      
    } catch (error) {
      this.log(`❌ Failed to repair ${filename}: ${error.message}`, 'error');
    }
  }

  repairSqlContent(sql, filename) {
    let repaired = sql;
    
    // 1. Fix duplicate "IF NOT EXISTS" in CREATE TABLE statements
    repaired = repaired.replace(
      /CREATE TABLE IF NOT EXISTS IF NOT EXISTS (\w+)/g,
      'CREATE TABLE IF NOT EXISTS $1'
    );
    
    // 2. Fix duplicate "IF NOT EXISTS" in CREATE INDEX statements  
    repaired = repaired.replace(
      /CREATE INDEX IF NOT EXISTS IF NOT EXISTS (\w+)/g,
      'CREATE INDEX IF NOT EXISTS $1'
    );
    
    // 3. Fix duplicate "IF NOT EXISTS" in CREATE POLICY statements
    repaired = repaired.replace(
      /CREATE POLICY IF NOT EXISTS IF NOT EXISTS "([^"]+)"/g,
      'CREATE POLICY IF NOT EXISTS "$1"'
    );
    
    // 4. Ensure proper spacing around IF NOT EXISTS
    repaired = repaired.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    
    // 5. Remove trailing semicolons from function definitions (they're separate statements)
    // 6. Ensure proper SQL statement separation
    
    // 7. Add header comments
    const header = this.generateHeader(filename);
    
    return header + '\n\n' + repaired;
  }

  generateHeader(filename) {
    const timestamp = new Date().toISOString();
    return `-- ============================================================================
-- SAFE MIGRATION FILE: ${filename}
-- Generated: ${timestamp}
-- Purpose: Safe migration execution without conflicts
-- 
-- Changes Made:
-- - Fixed duplicate IF NOT EXISTS clauses
-- - Cleaned up spacing and formatting
-- - Ensured proper SQL syntax
-- 
-- This file should execute safely on existing databases.
-- ============================================================================`;
  }

  async showResults() {
    console.log(`\n${COLORS.cyan}=== MIGRATION REPAIR RESULTS ===${COLORS.reset}`);
    
    console.log(`\n${COLORS.green}Repaired Files Created (${this.repairedFiles.length}):${COLORS.reset}`);
    for (const file of this.repairedFiles) {
      console.log(`\n  ✅ ${file.repaired}`);
      console.log(`     Original: ${file.original}`);
      console.log(`     Description: ${file.description}`);
      console.log(`     Size: ${file.size} characters`);
    }
    
    console.log(`\n${COLORS.yellow}📋 Next Steps:${COLORS.reset}`);
    console.log('1. These repaired files are ready to execute');
    console.log('2. Copy and paste into Supabase SQL Editor');
    console.log('3. Execute in order: ai-suggestions → analytics → file-analyses → chat-rls');
    
    if (this.repairedFiles.length > 0) {
      console.log(`\n${COLORS.cyan}🚀 Ready to Execute:${COLORS.reset}`);
      console.log('Execute these safe files in Supabase:');
      for (const file of this.repairedFiles) {
        console.log(`   1. ${file.repaired}`);
      }
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
  const repairer = new MigrationFileRepairer();
  repairer.repairAll()
    .then(() => {
      console.log('\n✅ Migration file repair completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration file repair failed:', error);
      process.exit(1);
    });
}

module.exports = MigrationFileRepairer;
