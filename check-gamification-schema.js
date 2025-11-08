// Check user_gamification table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSchema() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Checking user_gamification table schema...');
    
    // Try to query the table directly to see if it exists
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table access error:', error.message);
      
      // Check if it's a column not found error
      if (error.message.includes('total_penalty_points')) {
        console.log('🎯 Root cause found: total_penalty_points column is missing from the actual database table');
      }
      return;
    }

    console.log('✅ Table exists and is accessible');
    
  } catch (e) {
    console.error('❌ Exception:', e.message);
  }
}

checkSchema();