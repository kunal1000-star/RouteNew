-- Simple RLS fix for student_ai_profile table
-- This is the minimal fix to allow the API to work

-- Option 1: Disable RLS completely (simplest but least secure)
-- ALTER TABLE student_ai_profile DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a policy that allows anonymous access with user_id validation (recommended)
ALTER TABLE student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Remove the restrictive existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON student_ai_profile;

-- Create a policy that allows SELECT access for authenticated users and API calls
CREATE POLICY "Allow profile access" ON student_ai_profile
FOR SELECT USING (
  auth.uid() = user_id  -- Allow authenticated users to access their own data
);

-- Grant permissions to anon role (needed for API calls)
GRANT SELECT ON student_ai_profile TO anon;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON student_ai_profile TO authenticated;