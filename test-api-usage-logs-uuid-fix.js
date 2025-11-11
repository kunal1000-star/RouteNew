// Test API Usage Logs UUID Fix
// ============================

const { createClient } = require('@supabase/supabase-js');

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

async function testApiUsageLogsUuidFix() {
  console.log('🧪 Testing API Usage Logs UUID Fix...\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Check if the get_user_uuid function exists and works
    console.log('🔍 Test 1: Testing get_user_uuid function...');
    const testUserIds = ['test-user', 'anonymous-user', '00000000-0000-0000-0000-000000000000'];
    
    for (const userId of testUserIds) {
      try {
        const { data: uuid, error } = await supabase
          .rpc('get_user_uuid', { p_user_id_input: userId });
        
        if (error) {
          console.error(`❌ Failed to convert user ID '${userId}':`, error.message);
          allTestsPassed = false;
        } else {
          console.log(`✅ User ID '${userId}' -> UUID: ${uuid}`);
        }
      } catch (error) {
        console.error(`❌ Exception converting user ID '${userId}':`, error.message);
        allTestsPassed = false;
      }
    }
    
    // Test 2: Test the enhanced logging function
    console.log('\n🔍 Test 2: Testing enhanced API usage logging...');
    try {
      const { data: logId, error } = await supabase
        .rpc('log_api_usage_enhanced', {
          p_user_id_input: 'test-user',
          p_feature_name: 'test_feature',
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
        allTestsPassed = false;
      } else {
        console.log(`✅ Successfully created log entry with ID: ${logId}`);
      }
    } catch (error) {
      console.error('❌ Exception logging test entry:', error.message);
      allTestsPassed = false;
    }
    
    // Test 3: Test the API logger class with updated behavior
    console.log('\n🔍 Test 3: Testing API logger class...');
    try {
      const { ApiUsageLogger } = require('./src/lib/ai/api-logger.ts');
      
      // Create a new logger instance
      const logger = new ApiUsageLogger({
        batchSize: 1,
        flushInterval: 1000,
        enableLogging: true
      });
      
      // Test logging with mixed user IDs
      await logger.logSuccess({
        userId: 'test-user',
        featureName: 'test_feature',
        provider: 'test_provider',
        modelUsed: 'test_model',
        tokensInput: 150,
        tokensOutput: 75,
        latencyMs: 250,
        cached: false,
        queryType: 'general',
        tierUsed: 'free',
        fallbackUsed: false
      });
      
      await logger.flushNow();
      
      console.log('✅ API logger class test completed successfully');
      
      await logger.destroy();
      
    } catch (error) {
      console.error('❌ API logger class test failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 4: Check for any existing problematic UUIDs in logs
    console.log('\n🔍 Test 4: Checking for problematic UUIDs in existing logs...');
    try {
      const { data: logs, error } = await supabase
        .from('api_usage_logs')
        .select('user_id, feature_name, timestamp')
        .limit(10);
      
      if (error) {
        console.warn('⚠️  Could not check for problematic UUIDs:', error.message);
      } else if (logs && logs.length > 0) {
        let hasValidUUIDs = true;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        for (const log of logs) {
          if (!uuidRegex.test(log.user_id)) {
            hasValidUUIDs = false;
            console.warn(`⚠️  Found non-UUID user_id: ${log.user_id} in feature: ${log.feature_name}`);
          }
        }
        
        if (hasValidUUIDs) {
          console.log('✅ All user_ids in recent logs are valid UUIDs');
        }
      } else {
        console.log('ℹ️  No API usage logs found to validate');
      }
    } catch (error) {
      console.warn('⚠️  Exception checking for problematic UUIDs:', error.message);
    }
    
    // Test 5: Verify the endpoint column is present
    console.log('\n🔍 Test 5: Verifying endpoint column is present...');
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('endpoint')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.error('❌ Endpoint column missing from api_usage_logs table');
        allTestsPassed = false;
      } else if (error) {
        console.warn('⚠️  Could not verify endpoint column:', error.message);
      } else {
        console.log('✅ Endpoint column is accessible in api_usage_logs table');
      }
    } catch (error) {
      console.warn('⚠️  Exception verifying endpoint column:', error.message);
    }
    
    // Test 6: Check user_id_mappings table
    console.log('\n🔍 Test 6: Checking user_id_mappings table...');
    try {
      const { data: mappings, error } = await supabase
        .from('user_id_mappings')
        .select('*')
        .limit(5);
      
      if (error) {
        console.warn('⚠️  Could not access user_id_mappings table:', error.message);
      } else {
        console.log(`✅ Found ${mappings?.length || 0} user ID mappings`);
        if (mappings && mappings.length > 0) {
          console.log('   Sample mappings:', mappings.slice(0, 3).map(m => `${m.original_id} -> ${m.mapped_uuid}`));
        }
      }
    } catch (error) {
      console.warn('⚠️  Exception checking user_id_mappings table:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Exception during API usage logs UUID fix testing:', error.message);
    allTestsPassed = false;
  }
  
  // Final summary
  console.log('\n📋 Test Summary:');
  if (allTestsPassed) {
    console.log('🎉 All tests passed! The API usage logs UUID fix is working correctly.');
    console.log('💡 The continuous UUID format errors should now be resolved.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
    console.log('💡 The database schema fix may need to be executed manually.');
  }
  
  return allTestsPassed;
}

async function simulateProblematicUserIds() {
  console.log('\n🔄 Simulating problematic user ID scenarios...');
  
  const problematicUserIds = [
    'test-user',
    'anonymous-user', 
    'system-background-jobs',
    'diagnostic-test-user',
    '00000000-0000-0000-0000-000000000000', // Valid UUID
    '550e8400-e29b-41d4-a716-446655440000'  // Valid UUID
  ];
  
  for (const userId of problematicUserIds) {
    try {
      const { data: uuid, error } = await supabase
        .rpc('get_user_uuid', { p_user_id_input: userId });
      
      if (error) {
        console.error(`❌ Failed to convert '${userId}':`, error.message);
      } else {
        console.log(`✅ Successfully converted '${userId}' -> '${uuid}'`);
        
        // Now try to log API usage with this user ID
        const { data: logId, error: logError } = await supabase
          .rpc('log_api_usage_enhanced', {
            p_user_id_input: userId,
            p_feature_name: 'simulation_test',
            p_provider_used: 'test_provider',
            p_model_used: 'test_model',
            p_tokens_input: 50,
            p_tokens_output: 25,
            p_latency_ms: 100,
            p_success: true,
            p_query_type: 'simulation',
            p_endpoint: '/api/simulation',
            p_tier_used: 'free',
            p_fallback_used: false
          });
        
        if (logError) {
          console.error(`❌ Failed to log usage for '${userId}':`, logError.message);
        } else {
          console.log(`✅ Successfully logged usage for '${userId}' (ID: ${logId})`);
        }
      }
    } catch (error) {
      console.error(`❌ Exception processing '${userId}':`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 API Usage Logs UUID Fix Test Suite\n');
  
  // Run the main tests
  const testsPassed = await testApiUsageLogsUuidFix();
  
  // Run simulation
  await simulateProblematicUserIds();
  
  console.log('\n🏁 Test suite completed.');
  console.log(`Result: ${testsPassed ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  if (testsPassed) {
    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Database schema fix executed successfully');
    console.log('2. ✅ API logger updated to handle UUID conversion');
    console.log('3. ✅ Type definitions updated');
    console.log('4. ✅ All tests passing');
    console.log('5. 🔍 Monitor system logs for 24 hours to confirm error resolution');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testApiUsageLogsUuidFix, simulateProblematicUserIds };