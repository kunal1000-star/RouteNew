// RLS Policy Violation Fix - Direct SQL Executor (Alternative Method)
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
 * Try to execute the RLS fix using direct approach
 */
async function applyRLSFixDirect() {
  console.log('🔧 Applying RLS Policy Fix - Direct Method');
  console.log('===========================================');
  
  try {
    // Read the RLS fix migration
    const migrationPath = './fixed-migration-2025-11-07-student-profile-rls-fix-final.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // The SQL contains BEGIN/COMMIT, so we need to execute it as a single transaction
    // Let's try using a different approach - create individual fixes
    
    console.log('\n🎯 Step 1: Testing current RLS policies...');
    const { data: currentPolicies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'student_ai_profile');
    
    if (policyError) {
      console.log(`⚠️  Policy check failed: ${policyError.message}`);
    } else if (currentPolicies && currentPolicies.length > 0) {
      console.log(`📊 Found ${currentPolicies.length} existing policies:`);
      currentPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('📊 No existing RLS policies found');
    }
    
    console.log('\n🎯 Step 2: Testing trigger function...');
    const { data: functionExists, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'update_last_ai_interaction')
      .eq('routine_schema', 'public');
    
    if (functionError) {
      console.log(`⚠️  Function check failed: ${functionError.message}`);
    } else if (functionExists && functionExists.length > 0) {
      console.log('✅ Trigger function exists');
    } else {
      console.log('❌ Trigger function not found');
    }
    
    console.log('\n🎯 Step 3: Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('student_ai_profile')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Table access failed: ${tableError.message}`);
      console.log('💡 This confirms the RLS policy issue');
    } else {
      console.log('✅ Table access works');
    }
    
    // Test if we can create policies using direct methods
    console.log('\n🎯 Step 4: Attempting direct policy creation...');
    try {
      // Try to drop existing policies first
      const dropPolicySQL = 'DROP POLICY IF EXISTS "Users can manage their own profile" ON public.student_ai_profile;';
      console.log('   Dropping existing policy...');
      // Note: We can't execute this directly, so let's provide manual instructions
      
    } catch (error) {
      console.log(`⚠️  Policy modification failed: ${error.message}`);
    }
    
    console.log('\n📋 MANUAL FIX REQUIRED');
    console.log('=======================');
    console.log('Since automated SQL execution is not available, please follow these steps:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('```sql');
    console.log(sql);
    console.log('```');
    console.log('');
    console.log('5. Click "Run" to execute the migration');
    console.log('6. Verify the migration completed successfully');
    console.log('');
    
    return false; // Manual intervention required
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 RLS Policy Fix - Alternative Execution');
  console.log('==========================================\n');
  
  const success = await applyRLSFixDirect();
  
  if (!success) {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Follow the manual steps above');
    console.log('2. After running the SQL manually, test chat functionality');
    console.log('3. Monitor logs for RLS violations');
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { applyRLSFixDirect };
