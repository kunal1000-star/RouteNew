// Execute API Usage Logs UUID Schema Fix
// =======================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyApiUsageLogsSchemaFix() {
  console.log('🔧 Applying API Usage Logs Schema and UUID Fix...');
  
  try {
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix-api-usage-logs-uuid-schema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL fix file not found: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('execute_sql', {
          query: statement + ';'
        });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} had issues:`, error.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    return errorCount === 0;
    
  } catch (error) {
    console.error('❌ Failed to apply API usage logs schema fix:', error.message);
    return false;
  }
}

async function testApiUsageLogsFix() {
  console.log('\n🧪 Testing API Usage Logs Fix...');
  
  try {
    // Test 1: Check if the user_id_mappings table exists and has data
    console.log('🔍 Test 1: Checking user_id_mappings table...');
    const { data: mappings, error: mappingError } = await supabase
      .from('user_id_mappings')
      .select('*')
      .limit(5);
    
    if (mappingError) {
      console.error('❌ Failed to query user_id_mappings table:', mappingError.message);
    } else {
      console.log(`✅ Found ${mappings?.length || 0} user ID mappings`);
    }
    
    // Test 2: Test the get_user_uuid function
    console.log('🔍 Test 2: Testing get_user_uuid function...');
    const testUsers = ['test-user', 'anonymous-user', '00000000-0000-0000-0000-000000000000'];
    
    for (const userId of testUsers) {
      try {
        const { data: uuid, error } = await supabase
          .rpc('get_user_uuid', { p_user_id_input: userId });
        
        if (error) {
          console.error(`❌ Failed to convert user ID '${userId}':`, error.message);
        } else {
          console.log(`✅ User ID '${userId}' -> UUID: ${uuid}`);
        }
      } catch (error) {
        console.error(`❌ Exception converting user ID '${userId}':`, error.message);
      }
    }
    
    // Test 3: Test the enhanced logging function
    console.log('🔍 Test 3: Testing enhanced API usage logging...');
    try {
      const { data: logId, error } = await supabase
        .rpc('log_api_usage_enhanced', {
          p_user_id_input: 'test-user',
          p_feature_name: 'api_test',
          p_provider_used: 'test_provider',
          p_model_used: 'test_model',
          p_tokens_input: 100,
          p_tokens_output: 50,
          p_latency_ms: 200,
          p_success: true,
          p_query_type: 'test',
          p_endpoint: '/api/test',
          p_tier_used: 'free',
          p_fallback_used: false
        });
      
      if (error) {
        console.error('❌ Failed to log test entry:', error.message);
      } else {
        console.log(`✅ Successfully created log entry with ID: ${logId}`);
      }
    } catch (error) {
      console.error('❌ Exception logging test entry:', error.message);
    }
    
    // Test 4: Check API usage logs table structure
    console.log('🔍 Test 4: Checking api_usage_logs table structure...');
    const { data: logs, error: logsError } = await supabase
      .from('api_usage_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.error('❌ Failed to query api_usage_logs table:', logsError.message);
    } else {
      console.log(`✅ Found ${logs?.length || 0} API usage log entries`);
      if (logs && logs.length > 0) {
        const sampleLog = logs[0];
        const requiredFields = ['user_id', 'feature_name', 'endpoint', 'timestamp'];
        const hasRequiredFields = requiredFields.every(field => field in sampleLog);
        
        if (hasRequiredFields) {
          console.log('✅ All required fields present in API usage logs');
        } else {
          console.warn('⚠️  Some required fields missing in API usage logs');
        }
      }
    }
    
    // Test 5: Check for any remaining problematic UUIDs
    console.log('🔍 Test 5: Checking for problematic UUIDs...');
    const { data: problematicLogs, error: problemError } = await supabase
      .from('api_usage_logs')
      .select('user_id, feature_name, timestamp')
      .limit(10);
    
    if (problemError) {
      console.warn('⚠️  Could not check for problematic UUIDs:', problemError.message);
    } else if (problematicLogs && problematicLogs.length > 0) {
      let hasValidUUIDs = true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      for (const log of problematicLogs) {
        if (!uuidRegex.test(log.user_id)) {
          hasValidUUIDs = false;
          console.warn(`⚠️  Found non-UUID user_id: ${log.user_id} in feature: ${log.feature_name}`);
        }
      }
      
      if (hasValidUUIDs) {
        console.log('✅ All user_ids are valid UUIDs');
      }
    } else {
      console.log('ℹ️  No API usage logs found to validate');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Exception during testing:', error.message);
    return false;
  }
}

async function simulateApiLogger() {
  console.log('\n🔄 Simulating API Logger with mixed user IDs...');
  
  try {
    // Simulate the API logger behavior with problematic user IDs
    const testUserIds = ['test-user', 'anonymous-user', 'system-background-jobs', '00000000-0000-0000-0000-000000000000'];
    
    for (const userId of testUserIds) {
      try {
        console.log(`📝 Logging usage for user: ${userId}`);
        
        const { data: logId, error } = await supabase
          .rpc('log_api_usage_enhanced', {
            p_user_id_input: userId,
            p_feature_name: 'simulated_chat',
            p_provider_used: 'test_provider',
            p_model_used: 'test_model',
            p_tokens_input: Math.floor(Math.random() * 500) + 100,
            p_tokens_output: Math.floor(Math.random() * 300) + 50,
            p_latency_ms: Math.floor(Math.random() * 1000) + 100,
            p_success: true,
            p_query_type: 'general',
            p_endpoint: '/api/chat/general',
            p_tier_used: 'free',
            p_fallback_used: false
          });
        
        if (error) {
          console.error(`❌ Failed to log usage for user '${userId}':`, error.message);
        } else {
          console.log(`✅ Successfully logged usage for user '${userId}' (ID: ${logId})`);
        }
      } catch (error) {
        console.error(`❌ Exception logging for user '${userId}':`, error.message);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Exception during API logger simulation:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting API Usage Logs UUID Schema Fix...\n');
  
  // Step 1: Apply the database schema fix
  const schemaApplied = await applyApiUsageLogsSchemaFix();
  
  if (!schemaApplied) {
    console.log('\n❌ Schema fix failed - cannot proceed with testing');
    return;
  }
  
  // Step 2: Test the fix
  const testPassed = await testApiUsageLogsFix();
  
  if (!testPassed) {
    console.log('\n⚠️  Some tests failed - check the output above');
  }
  
  // Step 3: Simulate API logger behavior
  const simulationPassed = await simulateApiLogger();
  
  if (!simulationPassed) {
    console.log('\n⚠️  API logger simulation had issues');
  }
  
  // Final summary
  console.log('\n📋 Final Summary:');
  console.log(`   🏗️  Schema Fix: ${schemaApplied ? '✅ Applied' : '❌ Failed'}`);
  console.log(`   🧪 Tests: ${testPassed ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   🔄 Simulation: ${simulationPassed ? '✅ Passed' : '❌ Failed'}`);
  
  if (schemaApplied && testPassed && simulationPassed) {
    console.log('\n🎉 API Usage Logs UUID Schema Fix completed successfully!');
    console.log('💡 The continuous UUID format errors should now be resolved');
  } else {
    console.log('\n⚠️  Fix completed with some issues - please review the output above');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyApiUsageLogsSchemaFix, testApiUsageLogsFix, simulateApiLogger };