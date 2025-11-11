const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyStudentProfileRLSFix() {
  console.log('🔧 Applying Student Profile RLS fix...');
  
  try {
    // RLS fix SQL for student_ai_profile table
    const rlsFixSQL = `
      -- Fix RLS policies for student_ai_profile table
      DROP POLICY IF EXISTS "Users can create their own profile" ON student_ai_profile;
      DROP POLICY IF EXISTS "Users can view their own profile" ON student_ai_profile;
      DROP POLICY IF EXISTS "Users can update their own profile" ON student_ai_profile;
      DROP POLICY IF EXISTS "Users can delete their own profile" ON student_ai_profile;
      DROP POLICY IF EXISTS "Users can manage their own student profile" ON student_ai_profile;
      DROP POLICY IF EXISTS "Allow authenticated profile creation" ON student_ai_profile;
      DROP POLICY IF EXISTS "Enable read access for users" ON student_ai_profile;
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_ai_profile;
      DROP POLICY IF EXISTS "Enable update for users" ON student_ai_profile;
      DROP POLICY IF EXISTS "Enable delete for users" ON student_ai_profile;

      -- Create comprehensive RLS policies for student_ai_profile
      CREATE POLICY "Users can read their own student profile" 
      ON student_ai_profile FOR SELECT 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can create their own student profile" 
      ON student_ai_profile FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own student profile" 
      ON student_ai_profile FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own student profile" 
      ON student_ai_profile FOR DELETE 
      USING (auth.uid() = user_id);

      ALTER TABLE student_ai_profile ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON student_ai_profile TO authenticated, service_role;
      GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    `;

    // Try to execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: rlsFixSQL 
    });

    if (error) {
      console.error('❌ Error applying RLS fix:', error);
      return false;
    } else {
      console.log('✅ RLS fix applied successfully!');
      return true;
    }
  } catch (error) {
    console.error('❌ Exception applying RLS fix:', error);
    return false;
  }
}

applyStudentProfileRLSFix().then(success => {
  if (success) {
    console.log('🎉 Student Profile RLS fix completed successfully!');
  } else {
    console.log('💥 Student Profile RLS fix failed!');
  }
});