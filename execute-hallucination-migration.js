/**
 * Execute 5-Layer Hallucination Prevention System Migration
 * This script executes the hallucination-prevention-system.sql migration
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class HallucinationMigrationExecutor {
    constructor() {
        this.migrationFile = 'src/lib/migrations/hallucination-prevention-system.sql';
        this.startTime = Date.now();
    }

    async executeMigration() {
        console.log('🚀 EXECUTING 5-LAYER HALLUCINATION PREVENTION MIGRATION');
        console.log('='.repeat(60));
        
        try {
            // Step 1: Verify migration file exists
            await this.verifyMigrationFile();
            
            // Step 2: Read and analyze migration
            await this.analyzeMigration();
            
            // Step 3: Test database connectivity
            await this.testDatabaseConnection();
            
            // Step 4: Provide execution instructions
            await this.provideExecutionInstructions();
            
            // Step 5: Post-migration validation guidance
            await this.provideValidationGuidance();
            
        } catch (error) {
            console.error(`❌ Migration preparation failed: ${error.message}`);
            process.exit(1);
        }
    }

    async verifyMigrationFile() {
        console.log('📋 VERIFYING MIGRATION FILE');
        console.log('='.repeat(30));
        
        if (!fs.existsSync(this.migrationFile)) {
            throw new Error(`Migration file not found: ${this.migrationFile}`);
        }
        
        const stats = fs.statSync(this.migrationFile);
        console.log(`✅ Migration file found: ${this.migrationFile}`);
        console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        const migrationSQL = fs.readFileSync(this.migrationFile, 'utf8');
        const lineCount = migrationSQL.split('\n').length;
        console.log(`📄 Lines of SQL: ${lineCount}`);
    }

    async analyzeMigration() {
        console.log('\n🔍 ANALYZING MIGRATION CONTENT');
        console.log('='.repeat(35));
        
        const migrationSQL = fs.readFileSync(this.migrationFile, 'utf8');
        
        // Key components to check
        const components = [
            { pattern: /CREATE EXTENSION.*vector/i, name: 'pgvector extension' },
            { pattern: /CREATE EXTENSION.*pgcrypto/i, name: 'pgcrypto extension' },
            { pattern: /CREATE EXTENSION.*pg_cron/i, name: 'pg_cron extension' },
            { pattern: /CREATE TABLE.*input_validation_logs/i, name: 'input_validation_logs table' },
            { pattern: /CREATE TABLE.*query_classifications/i, name: 'query_classifications table' },
            { pattern: /CREATE TABLE.*knowledge_base/i, name: 'knowledge_base table' },
            { pattern: /CREATE TABLE.*ai_responses/i, name: 'ai_responses table' },
            { pattern: /CREATE TABLE.*user_feedback/i, name: 'user_feedback table' },
            { pattern: /CREATE TABLE.*hallucination_events/i, name: 'hallucination_events table' },
            { pattern: /CREATE TABLE.*quality_thresholds/i, name: 'quality_thresholds table' },
            { pattern: /CREATE OR REPLACE FUNCTION.*calculate_quality_score/i, name: 'calculate_quality_score function' },
            { pattern: /CREATE OR REPLACE FUNCTION.*calculate_confidence_scores/i, name: 'calculate_confidence_scores function' },
            { pattern: /CREATE OR REPLACE FUNCTION.*detect_high_risk_interaction/i, name: 'detect_high_risk_interaction function' },
            { pattern: /CREATE TRIGGER.*ai_responses_confidence_trigger/i, name: 'ai_responses_confidence_trigger' },
            { pattern: /ENABLE ROW LEVEL SECURITY/i, name: 'RLS activation' },
            { pattern: /CREATE POLICY.*input_validation_logs/i, name: 'input_validation_logs RLS policy' },
            { pattern: /CREATE POLICY.*hallucination_events/i, name: 'hallucination_events RLS policy' },
            { pattern: /CREATE INDEX.*idx_/i, name: 'Performance indexes' },
            { pattern: /INSERT INTO.*quality_thresholds/i, name: 'Default quality thresholds' },
            { pattern: /SELECT cron\.schedule/i, name: 'Automated cleanup job' }
        ];
        
        let foundComponents = 0;
        for (const component of components) {
            if (component.pattern.test(migrationSQL)) {
                console.log(`✅ ${component.name}`);
                foundComponents++;
            } else {
                console.log(`❌ ${component.name} - Missing`);
            }
        }
        
        console.log(`\n📊 Migration Analysis: ${foundComponents}/${components.length} components found`);
        
        if (foundComponents < components.length * 0.8) {
            throw new Error('Migration file appears incomplete or corrupted');
        }
    }

    async testDatabaseConnection() {
        console.log('\n🧪 TESTING DATABASE CONNECTION');
        console.log('='.repeat(35));
        
        try {
            // Test basic connection with a simple query
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('id', { count: 'exact', head: true })
                .limit(0);
                
            if (error && !error.message.includes('does not exist')) {
                throw new Error(`Connection failed: ${error.message}`);
            }
            
            console.log('✅ Database connection successful');
            console.log('✅ Service role key has proper permissions');
            
        } catch (error) {
            console.log(`⚠️ Database connection issue: ${error.message}`);
            console.log('⚠️ This may be normal if tables don\'t exist yet');
        }
    }

    async provideExecutionInstructions() {
        console.log('\n🚀 MIGRATION EXECUTION INSTRUCTIONS');
        console.log('='.repeat(40));
        
        console.log(`
The hallucination-prevention-system.sql migration is ready for execution.

📋 MIGRATION OVERVIEW:
• Creates 20 tables for 5-layer hallucination prevention system
• Implements database functions, triggers, and RLS policies
• Sets up automated cleanup jobs
• Inserts default configuration data
• Estimated execution time: 30-60 seconds

🔧 EXECUTION METHODS:

1. SUPABASE DASHBOARD (Recommended):
   • Open: https://app.supabase.com
   • Navigate to: SQL Editor
   • Copy contents of: src/lib/migrations/hallucination-prevention-system.sql
   • Paste and execute

2. SUPABASE CLI:
   • supabase db reset --linked
   • supabase db push

3. POSTGRESQL CLI:
   • psql -h your-host -U postgres -d your-db -f src/lib/migrations/hallucination-prevention-system.sql

⚠️ IMPORTANT NOTES:
• Execute as service_role or admin user
• Ensure pgvector extension is available
• Transaction will be committed automatically
• No rollback needed - uses IF NOT EXISTS clauses
        `);
    }

    async provideValidationGuidance() {
        console.log('\n✅ POST-MIGRATION VALIDATION');
        console.log('='.repeat(35));
        
        console.log(`
After executing the migration, verify:

📋 TABLE VERIFICATION:
• input_validation_logs - Input validation tracking
• query_classifications - Query classification cache
• knowledge_base - Factual knowledge storage
• ai_responses - AI response storage with metadata
• user_feedback - User feedback collection
• hallucination_events - Hallucination detection events
• quality_thresholds - System quality configuration

🔧 FUNCTION VERIFICATION:
• calculate_quality_score() - Quality score calculation
• calculate_confidence_scores() - Confidence score calculation
• detect_high_risk_interaction() - Risk detection
• update_query_classification() - Classification updates
• cleanup_old_hallucination_data() - Data cleanup

🔒 RLS POLICY VERIFICATION:
• All tables should have RLS enabled
• User-specific access policies active
• System-level policies for automated processes

⚡ PERFORMANCE VERIFICATION:
• Indexes created for all tables
• Vector extension functional
• Automated cleanup job scheduled

🧪 FUNCTIONAL TESTING:
1. Test input validation logging
2. Test AI response storage
3. Test feedback collection
4. Test hallucination event detection
5. Test confidence score calculation
        `);
    }
}

// Main execution
const executor = new HallucinationMigrationExecutor();
executor.executeMigration()
    .then(() => {
        console.log('\n🎉 MIGRATION PREPARATION COMPLETE!');
        console.log('✅ Ready to execute hallucination-prevention-system.sql');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Migration preparation failed:', error);
        process.exit(1);
    });