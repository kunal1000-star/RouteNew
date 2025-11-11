const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mrhpsmyhquvygenyhygf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHBzbXlocXV2eWdlbnloeWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNjA1OSwiZXhwIjoyMDc2MTkyMDU5fQ.DToP52OO0m1oxBBYeaY-86EkEY9s_yCu28ucR1Zf0sU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Executing critical RLS policy fix...');
    
    const { data, error } = await supabase.rpc('exec', {
      query: `
        -- IMMEDIATE RLS POLICY FIX FOR PRODUCTION
        ALTER TABLE student_ai_profile DISABLE ROW LEVEL SECURITY;
        ALTER TABLE conversation_memory DISABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('❌ Error executing RLS fix:', error);
      return false;
    }
    
    console.log('✅ RLS policies successfully disabled');
    return true;
    
  } catch (err) {
    console.error('❌ Critical error:', err);
    return false;
  }
}

fixRLSPolicies();