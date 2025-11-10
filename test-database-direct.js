#!/usr/bin/env node

/**
 * Simple Database Test: Direct Supabase Connection
 * ================================================
 */

async function testDatabaseDirectly() {
  console.log('🧪 Testing Direct Database Connection');
  console.log('=' .repeat(40));
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing required environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // Test basic connection
    console.log('Testing basic connection...');
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('Error details:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Sample data:', data);
    
    // Test inserting a simple record
    console.log('Testing simple insert...');
    const testRecord = {
      id: 'test-simple-' + Date.now(),
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      conversation_id: 'simple-test',
      interaction_data: {
        content: 'My name is Kunal',
        response: 'Nice to meet you!',
        timestamp: new Date().toISOString()
      },
      quality_score: 0.5,
      memory_relevance_score: 0.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const insertResult = await supabase
      .from('conversation_memory')
      .insert([testRecord])
      .select('id')
      .single();
    
    if (insertResult.error) {
      console.log('❌ Insert failed:', insertResult.error.message);
      console.log('Error details:', insertResult.error);
      
      // Check if it's a constraint or schema issue
      if (insertResult.error.message.includes('violates')) {
        console.log('💡 This looks like a constraint or schema issue');
        console.log('Checking table schema...');
        
        const schemaResult = await supabase
          .from('conversation_memory')
          .select('*')
          .limit(1);
          
        if (schemaResult.error) {
          console.log('❌ Table access error:', schemaResult.error.message);
        } else {
          console.log('✅ Table accessible, schema check needed');
        }
      }
    } else {
      console.log('✅ Simple insert successful!');
      console.log('Inserted ID:', insertResult.data.id);
      
      // Clean up test record
      await supabase
        .from('conversation_memory')
        .delete()
        .eq('id', insertResult.data.id);
        
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testDatabaseDirectly().catch(console.error);