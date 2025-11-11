// Run Conversation Tables Migration
// =================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in .env file');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runConversationMigrations() {
  console.log('Starting conversation tables migration...');
  
  const migrations = [
    {
      name: 'conversations',
      sql: fs.readFileSync('src/lib/migrations/create_conversation_tables.sql', 'utf8')
    },
    {
      name: 'conversation_rls_policies', 
      sql: fs.readFileSync('src/lib/migrations/create_conversation_rls_policies.sql', 'utf8')
    }
  ];

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const migration of migrations) {
    console.log(`Processing migration: ${migration.name}`);
    
    try {
      // Check if conversations table exists (main check)
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (error && (error.message.includes('relation "public.conversations" does not exist') ||
                    error.message.includes('Could not find the table') ||
                    error.code === 'PGRST205')) {
        // Table doesn't exist, need to create it
        console.log(`  Table "conversations" doesn't exist, creating...`);
        console.log(`  Executing ${migration.name} migration...`);
        
        // Execute the SQL directly
        const { data: result, error: execError } = await supabase
          .rpc('exec_sql', { sql: migration.sql });
        
        if (execError) {
          console.error(`  Error executing ${migration.name} migration:`, execError);
          results.failed.push(migration.name);
        } else {
          console.log(`  ${migration.name} migration completed successfully`);
          results.success.push(migration.name);
        }
      } else if (error) {
        console.error(`  Error checking conversations table:`, error);
        results.failed.push(migration.name);
      } else {
        console.log(`  Conversations table already exists`);
        results.success.push(migration.name);
      }
    } catch (err) {
      console.error(`  Unexpected error with ${migration.name}:`, err);
      results.failed.push(migration.name);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('Conversation Migration Summary:');
  console.log(`Completed: ${results.success.length} migrations`);
  console.log(`Failed: ${results.failed.length} migrations`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed migrations:');
    results.failed.forEach(migration => {
      console.log(`   • ${migration}`);
    });
    console.log('\nManual execution required. Please run the SQL files directly in Supabase:');
    console.log('1. src/lib/migrations/create_conversation_tables.sql');
    console.log('2. src/lib/migrations/create_conversation_rls_policies.sql');
  } else {
    console.log('\nAll conversation migrations completed successfully!');
  }

  return results;
}

// Run migrations
runConversationMigrations()
  .then(results => {
    if (results.failed.length === 0) {
      console.log('\nConversation persistence system is ready!');
      process.exit(0);
    } else {
      console.log('\nSome migrations need manual execution');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Conversation migration process failed:', err);
    process.exit(1);
  });