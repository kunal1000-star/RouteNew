// RLS Policy Violation Fix - Direct Migration Executor
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute the RLS fix migration
 */
async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fix for student_ai_profile');
  console.log('===================================================');
  
  try {
    // Read the RLS fix migration
    const migrationPath = './fixed-migration-2025-11-07-student-profile-rls-fix-final.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
      .map(stmt => stmt + ';');
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let executedStatements = 0;
    let errors = [];
    
    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}`);
        console.log(`   Statement: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        // Use rpc to execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
          errors.push(error.message);
        } else {
          executedStatements++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (stmtError) {
        console.log(`❌ Error in statement ${i + 1}: ${stmtError.message}`);
        errors.push(stmtError.message);
      }
    }
    
    console.log('\n📊 MIGRATION RESULTS');
    console.log('====================');
    console.log(`✅ Statements executed: ${executedStatements}/${statements.length}`);
    
    if (errors.length > 0) {
      console.log(`⚠️  Warnings/Errors: ${errors.length}`);
      console.log('Errors:', errors);
    }
    
    // Test the fix
    console.log('\n🧪 Testing the RLS fix...');
    await testRLSFix();
    
    return errors.length === 0;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Test that the RLS fix is working
 */
async function testRLSFix() {
  try {
    console.log('🔍 Testing student_ai_profile table access...');
    
    // Test basic table access
    const { data, error } = await supabase
      .from('student_ai_profile')
      .select('user_id, last_ai_interaction, ai_interaction_count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table access test failed: ${error.message}`);
    } else {
      console.log('✅ Table access test passed');
    }
    
    // Test RLS policies
    console.log('🔐 Testing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'student_ai_profile');
    
    if (policyError) {
      console.log(`❌ Policy check failed: ${policyError.message}`);
    } else if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('❌ No RLS policies found');
    }
    
  } catch (error) {
    console.log(`❌ RLS test failed: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting RLS Policy Fix');
  console.log('===========================\n');
  
  const success = await applyRLSFix();
  
  if (success) {
    console.log('\n🎉 RLS Policy Fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test sending a chat message to trigger profile update');
    console.log('2. Verify no more RLS policy violations occur');
    console.log('3. Monitor application logs for any remaining errors');
  } else {
    console.log('\n💥 RLS Policy Fix failed!');
    console.log('\n🔧 Manual steps:');
    console.log('1. Copy the SQL from fixed-migration-2025-11-07-student-profile-rls-fix-final.sql');
    console.log('2. Execute it manually in Supabase SQL editor');
    console.log('3. Test the fix again');
  }
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { applyRLSFix, testRLSFix };
