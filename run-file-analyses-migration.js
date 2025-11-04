const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFileAnalysesTables() {
  console.log('Creating file analyses tables...');
  
  try {
    // First, let's check if the file_analyses table already exists
    const { data, error } = await supabase
      .from('file_analyses')
      .select('*')
      .limit(1);

    if (error && error.message.includes('relation "public.file_analyses" does not exist')) {
      console.log('File analyses tables do not exist. Running migration...');
      
      // Note: Due to Supabase JS client limitations with raw SQL,
      // we'll need to create tables using individual calls or provide the SQL for manual execution
      console.log('Please execute the following SQL in your Supabase SQL editor:');
      console.log('\n-- Enable pgvector extension');
      console.log('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('\n-- Create file analyses table');
      console.log('CREATE TABLE IF NOT EXISTS file_analyses (');
      console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
      console.log('    file_id TEXT NOT NULL,');
      console.log('    file_name TEXT NOT NULL,');
      console.log('    file_type TEXT NOT NULL,');
      console.log('    mime_type TEXT NOT NULL,');
      console.log('    file_size BIGINT,');
      console.log('    analysis_result JSONB NOT NULL,');
      console.log('    topics TEXT[] DEFAULT \'{}\',');
      console.log('    concepts TEXT[] DEFAULT \'{}\',');
      console.log('    difficulty_level TEXT CHECK (difficulty_level IN (\'Beginner\', \'Intermediate\', \'Advanced\')) DEFAULT \'Intermediate\',');
      console.log('    estimated_study_time INTEGER DEFAULT 60,');
      console.log('    subject TEXT DEFAULT \'Other\',');
      console.log('    keywords TEXT[] DEFAULT \'{}\',');
      console.log('    summary TEXT,');
      console.log('    key_insights TEXT[] DEFAULT \'{}\',');
      console.log('    ai_recommendations TEXT[] DEFAULT \'{}\',');
      console.log('    embedding vector(1536),');
      console.log('    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL \'6 months\'),');
      console.log('    is_active BOOLEAN DEFAULT true,');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      console.log('\n-- Create other required tables and indexes...');
      console.log('See migration-2025-11-04-file-analyses.sql for complete SQL.');
      
      return false;
    } else if (error) {
      console.error('Error checking file_analyses table:', error);
      return false;
    } else {
      console.log('File analyses tables already exist!');
      return true;
    }
  } catch (err) {
    console.error('Migration error:', err);
    return false;
  }
}

createFileAnalysesTables()
  .then(success => {
    if (success) {
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('Please run the migration manually using the SQL provided above.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
