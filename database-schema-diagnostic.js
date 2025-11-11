#!/usr/bin/env node

/**
 * Database Schema Diagnostic Tool
 * 
 * This script examines the ai_suggestions table schema to understand:
 * 1. Column data types and constraints
 * 2. Indexes and relationships
 * 3. Current data sample
 * 
 * Run: node database-schema-diagnostic.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseTableSchema() {
  console.log('🔍 AI Suggestions Table Schema Diagnostic');
  console.log('===========================================\n');

  try {
    // 1. Check if table exists and get basic info
    console.log('📋 Step 1: Checking table existence and basic structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type, is_insertable_into')
      .eq('table_name', 'ai_suggestions')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error checking table info:', tableError.message);
      return;
    }

    if (!tableInfo || tableInfo.length === 0) {
      console.log('⚠️  ai_suggestions table not found in information_schema');
      console.log('This might be a permissions issue or the table doesn\'t exist');
      
      // Try direct query to see if table exists
      console.log('\n📋 Step 1b: Attempting direct table access...');
      const { data, error: directError } = await supabase
        .from('ai_suggestions')
        .select('*')
        .limit(1);
        
      if (directError) {
        console.error('❌ Cannot access ai_suggestions table:', directError.message);
        return;
      }
      
      console.log('✅ Table exists but not visible in information_schema');
      tableInfo = [{ table_name: 'ai_suggestions', table_type: 'BASE TABLE', is_insertable_into: 'YES' }];
    } else {
      console.log('✅ Table found in information_schema');
      console.log(`   Table: ${tableInfo[0].table_name}`);
      console.log(`   Type: ${tableInfo[0].table_type}`);
      console.log(`   Insertable: ${tableInfo[0].is_insertable_into}\n`);
    }

    // 2. Get column definitions using pg_catalog
    console.log('📋 Step 2: Getting column definitions...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'ai_suggestions' })
      .select();

    // Alternative: Use direct SQL query
    const { data: columnData, error: sqlError } = await supabase
      .from('information_schema.columns')
      .select(`
        column_name, 
        data_type, 
        is_nullable, 
        column_default, 
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        udt_name
      `)
      .eq('table_name', 'ai_suggestions')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (sqlError) {
      console.error('❌ Error fetching column info:', sqlError.message);
      console.log('Trying alternative method...');
      
      // Try to get table structure by selecting sample data
      const { data: sample, error: sampleError } = await supabase
        .from('ai_suggestions')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('❌ Cannot query table:', sampleError.message);
        return;
      }
      
      if (sample && sample.length > 0) {
        console.log('📊 Sample row structure:');
        console.log(JSON.stringify(sample[0], null, 2));
        
        // Extract column types from sample
        const columns = Object.keys(sample[0]);
        console.log('\n📋 Column structure (from sample data):');
        columns.forEach(col => {
          const value = sample[0][col];
          const type = typeof value;
          console.log(`   ${col}: ${type}${type === 'string' ? ` (${value.length} chars)` : ''}`);
        });
      }
    } else {
      console.log('✅ Column information retrieved successfully:');
      columnData.forEach(col => {
        console.log(`\n   📌 ${col.column_name}`);
        console.log(`      Data Type: ${col.data_type} (${col.udt_name})`);
        console.log(`      Nullable: ${col.is_nullable}`);
        console.log(`      Default: ${col.column_default || 'None'}`);
        if (col.character_maximum_length) {
          console.log(`      Max Length: ${col.character_maximum_length}`);
        }
        if (col.numeric_precision) {
          console.log(`      Precision: ${col.numeric_precision}`);
          if (col.numeric_scale) {
            console.log(`      Scale: ${col.numeric_scale}`);
          }
        }
      });
    }

    // 3. Get current data sample
    console.log('\n📋 Step 3: Getting data sample...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.log('⚠️  Could not retrieve sample data:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample data retrieved:');
      sampleData.forEach((row, index) => {
        console.log(`\n   📄 Row ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          if (key === 'priority') {
            console.log(`      ${key}: ${value} (${typeof value}) ❗`);
          } else {
            console.log(`      ${key}: ${value} (${typeof value})`);
          }
        });
      });
    } else {
      console.log('ℹ️  Table is empty (no data)');
    }

    // 4. Check for constraints
    console.log('\n📋 Step 4: Checking constraints...');
    
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type,
        check_clause
      `)
      .eq('table_name', 'ai_suggestions')
      .eq('table_schema', 'public');

    if (constraintError) {
      console.log('⚠️  Could not retrieve constraint information:', constraintError.message);
    } else {
      console.log('✅ Constraints found:');
      if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`   🔒 ${constraint.constraint_name} (${constraint.constraint_type})`);
          if (constraint.check_clause) {
            console.log(`      Check: ${constraint.check_clause}`);
          }
        });
      } else {
        console.log('   ℹ️  No explicit constraints found');
      }
    }

    // 5. Check for triggers
    console.log('\n📋 Step 5: Checking triggers...');
    
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select(`
        trigger_name,
        event_manipulation,
        action_statement
      `)
      .eq('event_object_table', 'ai_suggestions')
      .eq('event_object_schema', 'public');

    if (triggerError) {
      console.log('⚠️  Could not retrieve trigger information:', triggerError.message);
    } else {
      console.log('✅ Triggers found:');
      if (triggers && triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log(`   ⚡ ${trigger.trigger_name} (${trigger.event_manipulation})`);
        });
      } else {
        console.log('   ℹ️  No triggers found');
      }
    }

    console.log('\n🎯 Diagnostic Complete!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Unexpected error during diagnostic:', error);
  }
}

// Create a stored procedure to get table columns if it doesn't exist
async function createUtilityFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
    RETURNS TABLE (
      column_name text,
      data_type text,
      is_nullable text,
      column_default text,
      character_maximum_length int,
      numeric_precision int,
      numeric_scale int,
      udt_name text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.udt_name::text
      FROM information_schema.columns c
      WHERE c.table_name = $1
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position;
    END;
    $$;
  `;

  try {
    // Note: We can't execute raw SQL with this client, so we'll skip this step
    console.log('📝 Note: To create utility function, run this SQL manually:');
    console.log(createFunctionSQL);
  } catch (error) {
    console.error('❌ Error creating utility function:', error);
  }
}

// Main execution
async function main() {
  await createUtilityFunction();
  await diagnoseTableSchema();
}

if (require.main === module) {
  main().then(() => {
    console.log('🏁 Diagnostic script completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { diagnoseTableSchema };