#!/usr/bin/env node

/**
 * Simple AI Suggestions Table Inspector
 * Directly inspects the ai_suggestions table to understand the priority field
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabase = createClient(
  'https://mrhpsmyhquvygenyhygf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHBzbXlocXV2eWdlbnloeWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTYwNTksImV4cCI6MjA3NjE5MjA1OX0.K0EyXnx2ORtmkjcZew3I833j5Wb_ITI5QO1zc1dURzM'
);

async function inspectAISuggestionsTable() {
  console.log('🔍 AI Suggestions Table Inspector');
  console.log('=================================\n');

  try {
    // 1. Check if we can access the table
    console.log('📋 Step 1: Attempting to access ai_suggestions table...');
    
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing ai_suggestions table:', error.message);
      
      // Check if table exists with different approach
      const { data: tables, error: tableError } = await supabase
        .from('ai_suggestions')
        .select('1')
        .limit(1);
        
      if (tableError) {
        console.error('❌ Table ai_suggestions does not exist or is not accessible');
        return;
      }
    }

    console.log('✅ Successfully accessed ai_suggestions table\n');

    // 2. Get column information by examining sample data
    console.log('📋 Step 2: Analyzing table structure from sample data...');
    
    if (data && data.length > 0) {
      console.log('📊 Sample row structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n📋 Column analysis:');
      const firstRow = data[0];
      Object.entries(firstRow).forEach(([key, value]) => {
        const type = typeof value;
        const sample = value !== null && value !== undefined ? ` | Sample: ${JSON.stringify(value).substring(0, 50)}` : '';
        console.log(`   ${key}: ${type}${type === 'string' ? ` (${value?.length || 0} chars)` : ''}${sample}`);
      });

      // Focus on priority field
      if (firstRow.priority !== undefined) {
        console.log('\n🎯 PRIORITY FIELD ANALYSIS:');
        console.log(`   Value: ${JSON.stringify(firstRow.priority)}`);
        console.log(`   Type: ${typeof firstRow.priority}`);
        console.log(`   Database accepts: ${type}`);
        
        // Test if we can insert string priority
        console.log('\n🧪 Testing priority type compatibility...');
        const testData = {
          user_id: 'test-user',
          suggestion_type: 'test',
          title: 'Test Priority Insert',
          description: 'Testing priority field',
          priority: 'high', // String value
          estimated_impact: 5,
          reasoning: 'Test',
          confidence_score: 0.8,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString()
        };

        const { data: insertTest, error: insertError } = await supabase
          .from('ai_suggestions')
          .insert(testData)
          .select('priority')
          .single();

        if (insertError) {
          console.log('❌ String priority test FAILED:');
          console.log(`   Error: ${insertError.message}`);
          
          // Test with integer priority
          console.log('\n🧪 Testing integer priority...');
          testData.priority = 3; // Integer value
          
          const { data: intTest, error: intError } = await supabase
            .from('ai_suggestions')
            .insert(testData)
            .select('priority')
            .single();
            
          if (intError) {
            console.log('❌ Integer priority test also FAILED:');
            console.log(`   Error: ${intError.message}`);
          } else {
            console.log('✅ Integer priority test SUCCEEDED');
            console.log(`   Inserted value: ${intTest.priority} (${typeof intTest.priority})`);
            
            // Clean up test data
            await supabase.from('ai_suggestions').delete().eq('id', intTest.id);
          }
        } else {
          console.log('✅ String priority test SUCCEEDED');
          console.log(`   Inserted value: ${insertTest.priority} (${typeof insertTest.priority})`);
          
          // Clean up test data
          await supabase.from('ai_suggestions').delete().eq('id', insertTest.id);
        }
      }
    } else {
      console.log('📋 Table is empty, checking table structure...');
      
      // Try to infer structure by attempting different priority types
      console.log('\n🧪 Testing priority field constraints with empty table...');
      
      const testRecord = {
        user_id: 'test-user',
        suggestion_type: 'test',
        title: 'Test Priority Insert',
        description: 'Testing priority field',
        estimated_impact: 5,
        reasoning: 'Test',
        confidence_score: 0.8,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      // Test string priority
      console.log('   Testing string priority ("high")...');
      try {
        testRecord.priority = 'high';
        const { data: test1, error: error1 } = await supabase
          .from('ai_suggestions')
          .insert(testRecord)
          .select('priority')
          .single();
          
        if (error1) {
          console.log(`   ❌ String "high" failed: ${error1.message}`);
          
          // Try integer
          testRecord.priority = 3;
          console.log('   Testing integer priority (3)...');
          const { data: test2, error: error2 } = await supabase
            .from('ai_suggestions')
            .insert(testRecord)
            .select('priority')
            .single();
            
          if (error2) {
            console.log(`   ❌ Integer 3 failed: ${error2.message}`);
          } else {
            console.log('   ✅ Integer 3 succeeded');
            await supabase.from('ai_suggestions').delete().eq('id', test2.id);
          }
        } else {
          console.log('   ✅ String "high" succeeded');
          await supabase.from('ai_suggestions').delete().eq('id', test1.id);
        }
      } catch (e) {
        console.log(`   ❌ Exception during test: ${e.message}`);
      }
    }

    console.log('\n🎯 Diagnostic Complete!');
    console.log('=================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Main execution
inspectAISuggestionsTable().then(() => {
  console.log('🏁 Inspection completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Inspection failed:', error);
  process.exit(1);
});