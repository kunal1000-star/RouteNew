#!/usr/bin/env node

/**
 * Non-AI System Error Fix Verification Test
 * Tests that critical infrastructure issues have been resolved
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

class NonAISystemFixVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
  }

  /**
   * Test 1: Verify background jobs import fixes
   */
  async testBackgroundJobImports() {
    console.log(`${COLORS.blue}🔍 Testing Background Job Import Fixes...${COLORS.reset}\n`);
    
    const backgroundJobFiles = [
      'src/lib/background-jobs/scheduler.ts',
      'src/lib/background-jobs/weekly-summary-generation.ts',
      'src/lib/background-jobs/health-check.ts'
    ];

    for (const file of backgroundJobFiles) {
      try {
        if (!fs.existsSync(file)) {
          console.log(`${COLORS.red}❌ File not found: ${file}${COLORS.reset}`);
          this.results.failed++;
          continue;
        }

        const content = fs.readFileSync(file, 'utf8');
        
        // Check for old import pattern
        const hasOldImport = content.includes("import { aiServiceManager } from '../ai/ai-service-manager';");
        const hasNewImport = content.includes("import { aiServiceManager } from '../ai/ai-service-manager-unified';");
        const hasDuplicateSupabase = content.split("import { supabase }").length > 2;
        
        if (hasOldImport) {
          console.log(`${COLORS.red}❌ ${file}: Still has old import pattern${COLORS.reset}`);
          this.results.failed++;
        } else if (hasNewImport) {
          console.log(`${COLORS.green}✅ ${file}: Fixed import pattern${COLORS.reset}`);
          this.results.passed++;
        } else {
          console.log(`${COLORS.yellow}⚠️ ${file}: No AI service manager import found${COLORS.reset}`);
          this.results.warnings++;
        }

        if (hasDuplicateSupabase) {
          console.log(`${COLORS.red}❌ ${file}: Has duplicate supabase imports${COLORS.reset}`);
          this.results.failed++;
        } else {
          console.log(`${COLORS.green}✅ ${file}: No duplicate imports${COLORS.reset}`);
          this.results.passed++;
        }

      } catch (error) {
        console.log(`${COLORS.red}❌ Error checking ${file}: ${error.message}${COLORS.reset}`);
        this.results.failed++;
      }
    }
  }

  /**
   * Test 2: Verify cron schedule option fixes
   */
  async testCronScheduleOptions() {
    console.log(`\n${COLORS.blue}🔍 Testing Cron Schedule Option Fixes...${COLORS.reset}\n`);
    
    const schedulerFile = 'src/lib/background-jobs/scheduler.ts';
    
    if (fs.existsSync(schedulerFile)) {
      const content = fs.readFileSync(schedulerFile, 'utf8');
      
      // Check for the problematic pattern
      const hasScheduledOption = content.includes('scheduled: false');
      
      if (hasScheduledOption) {
        console.log(`${COLORS.red}❌ scheduler.ts: Still has 'scheduled: false' option${COLORS.reset}`);
        this.results.failed++;
      } else {
        console.log(`${COLORS.green}✅ scheduler.ts: Fixed cron schedule options${COLORS.reset}`);
        this.results.passed++;
      }
    } else {
      console.log(`${COLORS.red}❌ scheduler.ts: File not found${COLORS.reset}`);
      this.results.failed++;
    }
  }

  /**
   * Test 3: Verify database type imports
   */
  async testDatabaseTypeImports() {
    console.log(`\n${COLORS.blue}🔍 Testing Database Type Imports...${COLORS.reset}\n`);
    
    const filesToCheck = [
      'src/lib/background-jobs/health-check.ts',
      'src/lib/background-jobs/weekly-summary-generation.ts'
    ];

    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        const hasDatabaseImport = content.includes("import { Database }");
        
        if (hasDatabaseImport) {
          console.log(`${COLORS.green}✅ ${file}: Database types imported${COLORS.reset}`);
          this.results.passed++;
        } else {
          console.log(`${COLORS.yellow}⚠️ ${file}: No database type import${COLORS.reset}`);
          this.results.warnings++;
        }
      }
    }
  }

  /**
   * Test 4: Check for remaining import/export issues
   */
  async testImportExportConsistency() {
    console.log(`\n${COLORS.blue}🔍 Testing Import/Export Consistency...${COLORS.reset}\n`);
    
    const sourceDir = 'src/lib';
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    const exportRegex = /export\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    
    const issues = [];
    
    // Check for non-existent imports
    const checkDirectory = (dir, basePath = '') => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          checkDirectory(fullPath, relativePath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.matchAll(importRegex);
          
          for (const match of matches) {
            const importPath = match[1];
            if (importPath.startsWith('@/')) continue; // Skip path aliases
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
              const resolvedPath = path.resolve(path.dirname(fullPath), importPath);
              if (!fs.existsSync(resolvedPath) && !fs.existsSync(resolvedPath + '.ts') && !fs.existsSync(resolvedPath + '.tsx')) {
                issues.push({
                  file: relativePath,
                  issue: `Import not found: ${importPath}`,
                  severity: 'warning'
                });
              }
            }
          }
        }
      }
    };
    
    try {
      checkDirectory(sourceDir);
      
      if (issues.length === 0) {
        console.log(`${COLORS.green}✅ No missing import issues found${COLORS.reset}`);
        this.results.passed++;
      } else {
        console.log(`${COLORS.yellow}⚠️ Found ${issues.length} import issues:${COLORS.reset}`);
        issues.slice(0, 5).forEach(issue => {
          console.log(`  ${COLORS.yellow}⚠️ ${issue.file}: ${issue.issue}${COLORS.reset}`);
        });
        if (issues.length > 5) {
          console.log(`  ${COLORS.yellow}... and ${issues.length - 5} more issues${COLORS.reset}`);
        }
        this.results.warnings += Math.min(issues.length, 5);
      }
    } catch (error) {
      console.log(`${COLORS.red}❌ Error checking imports: ${error.message}${COLORS.reset}`);
      this.results.failed++;
    }
  }

  /**
   * Test 5: Check for common TypeScript compilation issues
   */
  async testTypeScriptIssues() {
    console.log(`\n${COLORS.blue}🔍 Testing TypeScript Common Issues...${COLORS.reset}\n`);
    
    const criticalFiles = [
      'src/lib/background-jobs/scheduler.ts',
      'src/lib/background-jobs/health-check.ts',
      'src/lib/background-jobs/weekly-summary-generation.ts',
      'src/lib/hallucination-prevention/error-handling/retry-mechanisms.ts'
    ];
    
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for "never" type issues (usually from Supabase)
        const hasNeverTypes = content.includes(': never') || content.includes('Parameter of type \'never\'');
        if (hasNeverTypes) {
          console.log(`${COLORS.yellow}⚠️ ${file}: May have "never" type issues${COLORS.reset}`);
          this.results.warnings++;
        }
        
        // Check for duplicate imports
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
        const importMap = new Map();
        for (const line of importLines) {
          const match = line.match(/import.*from\s+['"]([^'"]+)['"]/);
          if (match) {
            const importPath = match[1];
            if (importMap.has(importPath)) {
              console.log(`${COLORS.red}❌ ${file}: Duplicate import: ${importPath}${COLORS.reset}`);
              this.results.failed++;
            } else {
              importMap.set(importPath, true);
            }
          }
        }
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`${COLORS.cyan}${COLORS.bright}=== NON-AI SYSTEM ERROR FIX VERIFICATION ===${COLORS.reset}\n`);
    
    await this.testBackgroundJobImports();
    await this.testCronScheduleOptions();
    await this.testDatabaseTypeImports();
    await this.testImportExportConsistency();
    await this.testTypeScriptIssues();
    
    this.showFinalResults();
  }

  /**
   * Show final results
   */
  showFinalResults() {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== VERIFICATION RESULTS ===${COLORS.reset}`);
    
    console.log(`\n${COLORS.green}✅ Passed: ${this.results.passed}${COLORS.reset}`);
    console.log(`${COLORS.red}❌ Failed: ${this.results.failed}${COLORS.reset}`);
    console.log(`${COLORS.yellow}⚠️ Warnings: ${this.results.warnings}${COLORS.reset}`);
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : '0';
    
    console.log(`\n${COLORS.blue}Success Rate: ${successRate}%${COLORS.reset}`);
    
    if (this.results.failed === 0) {
      console.log(`\n${COLORS.green}🎉 All critical infrastructure fixes verified!${COLORS.reset}`);
    } else {
      console.log(`\n${COLORS.yellow}⚠️ Some issues remain. Please review failed tests.${COLORS.reset}`);
    }
    
    console.log(`\n${COLORS.blue}Next Steps:${COLORS.reset}`);
    console.log(`1. If all tests pass: Non-AI system errors have been resolved`);
    console.log(`2. If warnings remain: Review for optimization opportunities`);
    console.log(`3. If failures remain: Address remaining infrastructure issues`);
    console.log(`4. Proceed with Study Buddy chat debugging using verified infrastructure`);
  }
}

// Main execution
if (require.main === module) {
  const verifier = new NonAISystemFixVerifier();
  verifier.runAllTests().catch(error => {
    console.error(`${COLORS.red}Verification failed:${COLORS.reset}`, error);
    process.exit(1);
  });
}

module.exports = NonAISystemFixVerifier;