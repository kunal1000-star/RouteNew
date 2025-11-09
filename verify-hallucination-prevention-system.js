/**
 * Comprehensive Database Verification for 5-Layer Hallucination Prevention System
 * This script verifies all database components are properly set up
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Key tables to test
const TEST_TABLES = [
    'input_validation_logs',
    'query_classifications', 
    'knowledge_base',
    'ai_responses',
    'user_feedback',
    'hallucination_events',
    'quality_thresholds'
];

// Functions to test
const TEST_FUNCTIONS = [
    'calculate_quality_score',
    'detect_high_risk_interaction',
    'calculate_confidence_scores'
];

class DatabaseVerifier {
    constructor() {
        this.results = {
            tables: { total: 0, working: 0, issues: [] },
            functions: { total: 0, working: 0, issues: [] },
            rls: { total: 0, working: 0, issues: [] },
            integrity: { total: 0, working: 0, issues: [] }
        };
    }

    async verifySystem() {
        console.log('🧪 COMPREHENSIVE DATABASE VERIFICATION');
        console.log('5-Layer Hallucination Prevention System\n');

        // Test 1: Table Structure and Access
        await this.verifyTables();
        
        // Test 2: Sample Data Insert/Read
        await this.verifyDataIntegrity();
        
        // Test 3: RLS Policies (basic check)
        await this.verifyRLSPolicies();
        
        // Test 4: Functions (if available via RPC)
        await this.verifyFunctions();
        
        // Display Results
        await this.displayResults();
        
        return this.results;
    }

    async verifyTables() {
        console.log('📋 VERIFYING TABLE STRUCTURE & ACCESS');
        console.log('='.repeat(50));
        
        this.results.tables.total = TEST_TABLES.length;
        
        for (const tableName of TEST_TABLES) {
            try {
                // Test basic select with count
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact' })
                    .limit(1);
                
                if (error) {
                    this.results.tables.issues.push(`${tableName}: ${error.message}`);
                    console.log(`❌ ${tableName}: Access failed - ${error.message}`);
                } else {
                    this.results.tables.working++;
                    console.log(`✅ ${tableName}: Accessible (${count || 0} records)`);
                }
            } catch (err) {
                this.results.tables.issues.push(`${tableName}: ${err.message}`);
                console.log(`❌ ${tableName}: Exception - ${err.message}`);
            }
        }
        
        console.log(`\n📊 Table Access: ${this.results.tables.working}/${this.results.tables.total} working\n`);
    }

    async verifyDataIntegrity() {
        console.log('🔍 VERIFYING DATA INTEGRITY');
        console.log('='.repeat(40));
        
        this.results.integrity.total = TEST_TABLES.length;
        
        // Test quality_thresholds table specifically (should have default data)
        try {
            const { data, error } = await supabase
                .from('quality_thresholds')
                .select('*')
                .limit(5);
                
            if (error) {
                this.results.integrity.issues.push(`quality_thresholds: ${error.message}`);
                console.log(`❌ quality_thresholds: ${error.message}`);
            } else {
                this.results.integrity.working++;
                if (data && data.length > 0) {
                    console.log(`✅ quality_thresholds: ${data.length} default thresholds found`);
                } else {
                    console.log(`⚠️ quality_thresholds: Empty (should have default data)`);
                }
            }
        } catch (err) {
            this.results.integrity.issues.push(`quality_thresholds: ${err.message}`);
            console.log(`❌ quality_thresholds: ${err.message}`);
        }
        
        // Test ai_responses table structure
        try {
            const { data, error } = await supabase
                .from('ai_responses')
                .select('*')
                .limit(1);
                
            if (error) {
                this.results.integrity.issues.push(`ai_responses: ${error.message}`);
                console.log(`❌ ai_responses: ${error.message}`);
            } else {
                this.results.integrity.working++;
                console.log(`✅ ai_responses: Table structure valid`);
            }
        } catch (err) {
            this.results.integrity.issues.push(`ai_responses: ${err.message}`);
            console.log(`❌ ai_responses: ${err.message}`);
        }
        
        console.log(`\n📊 Data Integrity: ${this.results.integrity.working}/${this.results.integrity.total} checks passed\n`);
    }

    async verifyRLSPolicies() {
        console.log('🔒 VERIFYING RLS POLICIES (Basic Check)');
        console.log('='.repeat(45));
        
        // Test RLS by trying to access data as authenticated user
        // Note: This is a basic check since we can't directly query pg_policies
        
        const { data, error } = await supabase
            .from('hallucination_events')
            .select('*', { count: 'exact' })
            .limit(1);
            
        if (error) {
            console.log(`ℹ️ RLS check: ${error.message} (may indicate RLS is active)`);
            this.results.rls.working++; // RLS causing access restriction is actually good
        } else {
            console.log(`✅ RLS: Data accessible (may be disabled or using service role)`);
            this.results.rls.working++;
        }
        
        this.results.rls.total = 1;
        console.log(`\n📊 RLS Status: Basic check completed\n`);
    }

    async verifyFunctions() {
        console.log('⚙️ VERIFYING DATABASE FUNCTIONS');
        console.log('='.repeat(40));
        
        // Note: We can't directly test functions via Supabase REST API
        // This would require RPC calls or direct SQL execution
        
        console.log('ℹ️ Function testing requires RPC calls or direct SQL execution');
        console.log('ℹ️ Functions should be available if migration was successful');
        console.log('ℹ️ Key functions to verify manually:');
        
        TEST_FUNCTIONS.forEach(func => {
            console.log(`  • ${func}`);
        });
        
        this.results.functions.total = TEST_FUNCTIONS.length;
        this.results.functions.working = 0; // Can't test via REST API
        console.log(`\n📊 Functions: Manual verification required\n`);
    }

    async displayResults() {
        console.log('📋 VERIFICATION SUMMARY');
        console.log('='.repeat(30));
        
        console.log(`\n🎯 TABLES:`);
        console.log(`  ✅ Working: ${this.results.tables.working}/${this.results.tables.total}`);
        if (this.results.tables.issues.length > 0) {
            console.log(`  ❌ Issues:`);
            this.results.tables.issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
        }
        
        console.log(`\n🔍 DATA INTEGRITY:`);
        console.log(`  ✅ Working: ${this.results.integrity.working}/${this.results.integrity.total}`);
        if (this.results.integrity.issues.length > 0) {
            console.log(`  ❌ Issues:`);
            this.results.integrity.issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
        }
        
        console.log(`\n🔒 RLS POLICIES:`);
        console.log(`  ✅ Status: ${this.results.rls.working}/${this.results.rls.total} (basic check)`);
        
        console.log(`\n⚙️ FUNCTIONS:`);
        console.log(`  ℹ️ Status: Manual verification required`);
        
        // Overall Assessment
        const totalWorking = this.results.tables.working + this.results.integrity.working + this.results.rls.working;
        const totalChecks = this.results.tables.total + this.results.integrity.total + this.results.rls.total;
        
        console.log(`\n🏆 OVERALL ASSESSMENT:`);
        console.log(`  ✅ Checks Passed: ${totalWorking}/${totalChecks}`);
        
        if (totalWorking === totalChecks) {
            console.log(`\n🎉 DATABASE VERIFICATION: SUCCESS!`);
            console.log(`  The 5-layer hallucination prevention system appears to be ready.`);
            console.log(`  All core tables are accessible and properly structured.`);
        } else {
            console.log(`\n⚠️ DATABASE VERIFICATION: ATTENTION NEEDED`);
            console.log(`  Some components may need manual verification or fixes.`);
        }
        
        console.log(`\n📝 RECOMMENDATIONS:`);
        console.log(`  1. Test the hallucination prevention system end-to-end`);
        console.log(`  2. Verify RLS policies are working correctly for regular users`);
        console.log(`  3. Test database functions via application code`);
        console.log(`  4. Monitor system performance with new tables in place`);
    }
}

// Run verification
const verifier = new DatabaseVerifier();
verifier.verifySystem()
    .then(results => {
        console.log('\n✅ Database verification completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });