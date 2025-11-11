// Direct Database Fix Script for API Usage Logs Schema
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixApiUsageLogsSchema() {
  console.log('🔧 Fixing API Usage Logs Schema...');
  
  try {
    // Add the missing query_type column
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        -- Add the missing query_type column to api_usage_logs table
        ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS query_type TEXT;
        
        -- Add an index on query_type for better performance
        CREATE INDEX IF NOT EXISTS idx_api_usage_logs_query_type ON api_usage_logs(query_type);
        
        -- Update existing records to have a default query_type if null
        UPDATE api_usage_logs 
        SET query_type = 'general' 
        WHERE query_type IS NULL;
      `
    });

    if (error) {
      console.error('❌ Error fixing schema:', error);
      return false;
    }

    console.log('✅ API Usage Logs schema fixed successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception fixing schema:', error.message);
    return false;
  }
}

async function verifyFix() {
  console.log('🔍 Verifying fix...');
  
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('query_type')
      .limit(1);

    if (error && error.code === 'PGRST204') {
      console.error('❌ Fix verification failed - query_type column still missing');
      return false;
    } else if (error) {
      console.error('❌ Error verifying fix:', error);
      return false;
    }

    console.log('✅ Fix verification successful - query_type column is now accessible');
    return true;
  } catch (error) {
    console.error('❌ Exception verifying fix:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database fix for API Usage Logs...\n');
  
  const fixed = await fixApiUsageLogsSchema();
  
  if (fixed) {
    console.log('\n🔍 Verifying the fix...');
    const verified = await verifyFix();
    
    if (verified) {
      console.log('\n🎉 Database fix completed successfully!');
      console.log('💡 The API usage logs system should now work without errors');
    } else {
      console.log('\n⚠️ Schema fix was applied but verification failed');
      console.log('💡 Please check the database manually');
    }
  } else {
    console.log('\n❌ Database fix failed!');
    console.log('💡 Please check the error messages above');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixApiUsageLogsSchema, verifyFix };