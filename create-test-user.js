// Create a test user for memory testing
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mrhpsmyhquvygenyhygf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHBzbXlocXV2eWdlbnloeWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNjA1OSwiZXhwIjoyMDc2MTkyMDU5fQ.DToP52OO0m1oxBBYeaY-86EkEY9s_yCu28ucR1Zf0sU';

async function createTestUser() {
  console.log("👤 Creating test user for Kunal memory scenario...");
  
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if test user already exists
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    console.log(`🔍 Checking if test user ${testUserId} exists...`);
    
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', testUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("❌ Error checking existing user:", checkError.message);
      return;
    }

    if (existingUser) {
      console.log("✅ Test user already exists");
    } else {
      console.log("🆕 Creating new test user...");
      
      // Create test user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'kunal-test@example.com',
          full_name: 'Kunal Test User',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error creating test user:", insertError.message);
        return;
      }

      console.log("✅ Test user created successfully:", newUser);
    }

    // Verify by checking the user exists
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', testUserId)
      .single();

    if (verifyError) {
      console.error("❌ Error verifying user:", verifyError.message);
      return;
    }

    console.log("✅ Test user verified:", verifyUser);
    console.log("\n🎉 Test user setup complete! Ready for memory testing.");
    return testUserId;

  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

// Run the function
createTestUser();