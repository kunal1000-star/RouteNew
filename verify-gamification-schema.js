/**
 * Diagnostic script to verify the user_gamification table schema
 * This will help identify if the 'level' column is missing
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  console.log('🔍 Checking user_gamification table schema...');
  
  try {
    // Query the information schema to get column details
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'user_gamification')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Error querying schema:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ user_gamification table does not exist');
      console.log('💡 This indicates the table needs to be created');
      return;
    }

    console.log('📋 Current user_gamification table columns:');
    data.forEach(column => {
      console.log(`   ${column.column_name} (${column.data_type}) - Default: ${column.column_default || 'none'}`);
    });

    // Check specifically for the level column
    const hasLevelColumn = data.some(col => col.column_name === 'level');
    const hasCurrentLevelColumn = data.some(col => col.column_name === 'current_level');

    console.log('\n🎯 Column Analysis:');
    console.log(`   level column: ${hasLevelColumn ? '✅ exists' : '❌ missing'}`);
    console.log(`   current_level column: ${hasCurrentLevelColumn ? '✅ exists' : '❌ missing'}`);

    if (!hasLevelColumn) {
      console.log('\n❌ ISSUE CONFIRMED: The "level" column is missing from user_gamification table');
      console.log('💡 This will cause the gamification initialization to fail');
      console.log('🔧 Solution: Add the missing "level" column via migration');
    } else {
      console.log('\n✅ The "level" column exists - gamification should work');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableSchema();