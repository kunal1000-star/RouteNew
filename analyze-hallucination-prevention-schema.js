/**
 * Database Schema Analysis for 5-Layer Hallucination Prevention System
 * This script analyzes the current database state and identifies missing components
 */

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

// Tables that should exist for 5-layer hallucination prevention system
const REQUIRED_TABLES = {
    // Layer 1: Input Validation & Preprocessing
    'input_validation_logs': 'Input sanitization and validation logs',
    'query_classifications': 'Query classification cache and results',
    'prompt_engineering_rules': 'Prompt engineering rules and templates',
    
    // Layer 2: Context & Memory Management
    'knowledge_base': 'Knowledge base for factual grounding',
    'knowledge_sources': 'Knowledge sources and references',
    'conversation_memory': 'Conversation memory and context',
    'context_optimization_logs': 'Context optimization tracking',
    
    // Layer 3: Response Validation & Fact-Checking
    'response_validations': 'Response validation results',
    'ai_responses': 'AI response storage and metadata',
    'fact_checks': 'Fact-checking results and verification',
    'response_contradictions': 'Contradiction detection and resolution',
    'confidence_scores': 'Confidence scoring for responses',
    
    // Layer 4: User Feedback & Learning
    'user_feedback': 'User feedback collection and storage',
    'feedback_patterns': 'Feedback pattern analysis',
    'learning_updates': 'Learning and system updates',
    
    // Layer 5: Quality Assurance & Monitoring
    'quality_metrics': 'Quality metrics and monitoring',
    'performance_analytics': 'Performance analytics data',
    'system_alerts': 'System alerts and notifications',
    'hallucination_events': 'Hallucination detection events',
    'quality_thresholds': 'Quality thresholds configuration'
};

// Additional core tables that might be needed
const CORE_TABLES = {
    'activity_logs': 'User activity logging',
    'chat_conversations': 'Chat conversation management',
    'chat_messages': 'Chat message storage',
    'study_chat_memory': 'Study chat memory with embeddings',
    'api_usage_logs': 'API usage tracking',
    'analytics_events': 'Analytics event logging',
    'ai_suggestions': 'AI suggestion system',
    'suggestion_interactions': 'Suggestion interaction tracking',
    'suggestion_generation_logs': 'Suggestion generation logs'
};

class HallucinationPreventionAnalyzer {
    constructor() {
        this.existingTables = new Set();
        this.missingTables = [];
    }

    async analyzeTables() {
        console.log('🔍 Analyzing Database Schema for 5-Layer Hallucination Prevention System\n');
        
        // Check hallucination prevention tables
        console.log('🎯 5-LAYER HALLUCINATION PREVENTION SYSTEM ANALYSIS');
        console.log('='.repeat(60));
        
        for (const [tableName, description] of Object.entries(REQUIRED_TABLES)) {
            const exists = await this.checkTableExists(tableName);
            if (exists) {
                this.existingTables.add(tableName);
                console.log(`✅ ${tableName} - ${description}`);
            } else {
                this.missingTables.push(tableName);
                console.log(`❌ ${tableName} - ${description}`);
            }
        }
        
        console.log(`\n📈 Hallucination Prevention Tables: ${this.existingTables.size}/${Object.keys(REQUIRED_TABLES).length}`);
        
        // Check core tables
        console.log('\n🔧 CORE SYSTEM TABLES ANALYSIS');
        console.log('='.repeat(40));
        
        const missingCoreTables = [];
        const existingCoreTables = [];
        
        for (const [tableName, description] of Object.entries(CORE_TABLES)) {
            const exists = await this.checkTableExists(tableName);
            if (exists) {
                existingCoreTables.push(tableName);
                console.log(`✅ ${tableName} - ${description}`);
            } else {
                missingCoreTables.push(tableName);
                console.log(`❌ ${tableName} - ${description}`);
            }
        }
        
        console.log(`\n📈 Core Tables: ${existingCoreTables.length}/${Object.keys(CORE_TABLES).length}`);
        
        // Summary and recommendations
        console.log('\n📋 MIGRATION RECOMMENDATIONS');
        console.log('='.repeat(50));
        
        const totalMissingTables = this.missingTables.length + missingCoreTables.length;
        
        if (this.missingTables.length > 0) {
            console.log(`\n🎯 HALLUCINATION PREVENTION MIGRATION NEEDED`);
            console.log(`Missing ${this.missingTables.length} core tables:`);
            this.missingTables.forEach(table => {
                console.log(`  • ${table} - ${REQUIRED_TABLES[table]}`);
            });
        }
        
        if (missingCoreTables.length > 0) {
            console.log(`\n🔧 CORE SYSTEM MIGRATION NEEDED`);
            console.log(`Missing ${missingCoreTables.length} core tables:`);
            missingCoreTables.slice(0, 5).forEach(table => {
                console.log(`  • ${table} - ${CORE_TABLES[table]}`);
            });
            if (missingCoreTables.length > 5) {
                console.log(`  • ... and ${missingCoreTables.length - 5} more`);
            }
        }
        
        // Overall status
        console.log('\n📊 OVERALL SYSTEM STATUS');
        console.log('='.repeat(30));
        console.log(`✅ Hallucination Prevention Tables: ${this.existingTables.size}/${Object.keys(REQUIRED_TABLES).length}`);
        console.log(`✅ Core Tables: ${existingCoreTables.length}/${Object.keys(CORE_TABLES).length}`);
        
        if (totalMissingTables === 0) {
            console.log('\n🎉 ALL REQUIRED TABLES EXIST! The 5-layer system should be ready.');
        } else {
            console.log(`\n⚠️  MIGRATION REQUIRED: ${totalMissingTables} missing tables need to be created`);
            console.log('\nRecommended Actions:');
            console.log('1. Run hallucination-prevention-system.sql migration');
            console.log('2. Run complete-database-schema-migration.sql if needed');
            console.log('3. Verify all functions, triggers, and RLS policies');
        }
        
        return {
            existingTables: Array.from(this.existingTables),
            missingHallucinationTables: this.missingTables,
            existingCoreTables,
            missingCoreTables,
            totalMissingTables
        };
    }

    async checkTableExists(tableName) {
        try {
            // Try to query the table with a limit of 0 to check existence
            const { data, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .limit(0);
            
            // If we get a "does not exist" error, the table doesn't exist
            if (error && error.message.includes('does not exist')) {
                return false;
            }
            
            // If no error, table exists
            return true;
        } catch (error) {
            // If there's any other error, assume table doesn't exist
            return false;
        }
    }
}

// Run the analysis
const analyzer = new HallucinationPreventionAnalyzer();
analyzer.analyzeTables()
    .then(result => {
        console.log('\n✅ Database schema analysis completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });