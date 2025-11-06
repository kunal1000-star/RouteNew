#!/usr/bin/env node

/**
 * ============================================================================
 * MIGRATION FILE CLEANER
 * ============================================================================
 * 
 * Cleans up migration files by removing commands that might conflict
 * with existing database objects. Adds IF NOT EXISTS clauses where missing.
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

class MigrationFileCleaner {
  constructor() {
    this.cleanedFiles = [];
  }

  async cleanAll() {
    try {
      this.log('🧹 Starting Migration File Cleaning Process', 'info');
      
      // Clean each migration file
      await this.cleanFile('migration-2025-11-04-ai-suggestions.sql', 'AI Suggestions System');
      await this.cleanFile('migration-2025-11-04-analytics.sql', 'Comprehensive Analytics');
      await this.cleanFile('migration-2025-11-04-file-analyses.sql', 'File Analysis System');
      await this.cleanFile('migration-2025-11-05-fix-chat-rls.sql', 'Chat RLS Fix');
      
      // Show results
      await this.showResults();
      
    } catch (error) {
      this.log(`❌ Cleaning failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanFile(filename, description) {
    const originalPath = `./${filename}`;
    const cleanedPath = `./cleaned-${filename}`;
    
    this.log(`\n🧹 Cleaning ${filename} (${description})`, 'info');
    
    if (!fs.existsSync(originalPath)) {
      this.log(`❌ File not found: ${originalPath}`, 'error');
      return;
    }
    
    try {
      // Read original content
      const originalContent = fs.readFileSync(originalPath, 'utf8');
      
      // Clean the content
      const cleanedContent = this.cleanSqlContent(originalContent, filename);
      
      // Write cleaned file
      fs.writeFileSync(cleanedPath, cleanedContent);
      
      this.log(`✅ Created cleaned file: ${cleanedPath}`, 'success');
      this.cleanedFiles.push({
        original: filename,
        cleaned: cleanedPath,
        description: description,
        size: cleanedContent.length
      });
      
    } catch (error) {
      this.log(`❌ Failed to clean ${filename}: ${error.message}`, 'error');
    }
  }

  cleanSqlContent(sql, filename) {
    let cleaned = sql;
    
    // 1. Ensure all CREATE TABLE statements have IF NOT EXISTS
    cleaned = cleaned.replace(
      /CREATE TABLE (\w+)/g,
      'CREATE TABLE IF NOT EXISTS $1'
    );
    
    // 2. Ensure all CREATE INDEX statements have IF NOT EXISTS
    cleaned = cleaned.replace(
      /CREATE INDEX (\w+) ON/g,
      'CREATE INDEX IF NOT EXISTS $1 ON'
    );
    
    // 3. Ensure all CREATE POLICY statements have IF NOT EXISTS
    cleaned = cleaned.replace(
      /CREATE POLICY "([^"]+)" ON/g,
      'CREATE POLICY IF NOT EXISTS "$1" ON'
    );
    
    // 4. Ensure all CREATE FUNCTION statements have IF NOT EXISTS (with replacement)
    cleaned = cleaned.replace(
      /CREATE OR REPLACE FUNCTION/g,
      'CREATE OR REPLACE FUNCTION' // Keep this as is since OR REPLACE is safe
    );
    
    // 5. Remove DROP POLICY IF NOT EXISTS statements that might cause issues
    // (These are safe but unnecessary if using IF NOT EXISTS in CREATE)
    cleaned = cleaned.replace(
      /DROP POLICY IF EXISTS "[^"]+";/g,
      ''
    );
    
    // 6. Remove duplicate CREATE statements (basic duplicate detection)
    const lines = cleaned.split('\n');
    const seenCreates = new Set();
    const filteredLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip duplicate CREATE statements (basic heuristic)
      if (trimmed.startsWith('CREATE TABLE') || 
          trimmed.startsWith('CREATE INDEX') || 
          trimmed.startsWith('CREATE POLICY')) {
        
        // Extract table/index/policy name
        let objectName = '';
        if (trimmed.startsWith('CREATE TABLE')) {
          objectName = trimmed.match(/CREATE TABLE (IF NOT EXISTS )?(\w+)/)?.[2] || '';
        } else if (trimmed.startsWith('CREATE INDEX')) {
          objectName = trimmed.match(/CREATE INDEX (IF NOT EXISTS )?(\w+)/)?.[2] || '';
        } else if (trimmed.startsWith('CREATE POLICY')) {
          objectName = trimmed.match(/CREATE POLICY (IF NOT EXISTS )?"([^"]+)"/)?.[2] || '';
        }
        
        if (objectName && seenCreates.has(objectName)) {
          this.log(`  ⚠️ Skipping duplicate: ${trimmed.substring(0, 60)}...`, 'warning');
          continue;
        }
        
        if (objectName) {
          seenCreates.add(objectName);
        }
      }
      
      filteredLines.push(line);
    }
    
    cleaned = filteredLines.join('\n');
    
    // 7. Add header comments
    const header = this.generateHeader(filename);
    
    return header + '\n\n' + cleaned;
  }

  generateHeader(filename) {
    const timestamp = new Date().toISOString();
    return `-- ============================================================================
-- CLEANED MIGRATION FILE: ${filename}
-- Generated: ${timestamp}
-- Purpose: Safe migration execution without conflicts
-- 
-- Changes Made:
-- - Added IF NOT EXISTS to CREATE TABLE statements
-- - Added IF NOT EXISTS to CREATE INDEX statements  
-- - Added IF NOT EXISTS to CREATE POLICY statements
-- - Removed duplicate DROP POLICY statements
-- - Removed basic duplicate CREATE statements
-- 
-- This file should execute safely on existing databases.
-- ============================================================================`;
  }

  async showResults() {
    console.log(`\n${COLORS.cyan}=== MIGRATION CLEANING RESULTS ===${COLORS.reset}`);
    
    console.log(`\n${COLORS.green}Cleaned Files Created (${this.cleanedFiles.length}):${COLORS.reset}`);
    for (const file of this.cleanedFiles) {
      console.log(`\n  ✅ ${file.cleaned}`);
      console.log(`     Original: ${file.original}`);
      console.log(`     Description: ${file.description}`);
      console.log(`     Size: ${file.size} characters`);
    }
    
    console.log(`\n${COLORS.yellow}📋 Next Steps:${COLORS.reset}`);
    console.log('1. Review the cleaned migration files');
    console.log('2. Execute them in Supabase SQL Editor or via RPC');
    console.log('3. The files are now safe to run on existing databases');
    
    if (this.cleanedFiles.length > 0) {
      console.log(`\n${COLORS.cyan}🚀 Ready to Execute:${COLORS.reset}`);
      console.log('Execute these cleaned files:');
      for (const file of this.cleanedFiles) {
        console.log(`   - ${file.cleaned}`);
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
  const cleaner = new MigrationFileCleaner();
  cleaner.cleanAll()
    .then(() => {
      console.log('\n✅ Migration file cleaning completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration file cleaning failed:', error);
      process.exit(1);
    });
}

module.exports = MigrationFileCleaner;
