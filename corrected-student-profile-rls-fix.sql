-- Corrected Student Profile RLS Fix
-- This file safely handles duplicate policy errors by dropping all existing policies first
-- Multiple options provided for different security requirements
-- Version: 2.0 - Safe execution even if policies already exist

-- =============================================================================
-- PRE-CLEANUP: Drop ALL existing policies to avoid conflicts
-- =============================================================================

-- Drop any existing policies on student_ai_profile table
DROP POLICY IF EXISTS "Allow profile access" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can view their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can create their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can manage their own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Allow authenticated profile creation" ON student_ai_profile;
DROP POLICY IF EXISTS "Enable read access for users" ON student_ai_profile;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_ai_profile;
DROP POLICY IF EXISTS "Enable update for users" ON student_ai_profile;
DROP POLICY IF EXISTS "Enable delete for users" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can read their own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can create their own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can update their own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can delete their own student profile" ON student_ai_profile;

-- =============================================================================
-- OPTION 1: MINIMAL FIX - Simple policy for immediate functionality
-- =============================================================================
-- This option creates the minimal policy needed to fix the immediate issue
-- Good for: Quick fixes, development environments

-- Create a simple policy that allows access based on user_id matching
CREATE POLICY "Simple profile access" ON student_ai_profile
FOR ALL
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- OPTION 2: COMPREHENSIVE FIX - Detailed policies for better security
-- =============================================================================
-- This option creates separate policies for each operation
-- Good for: Production environments, better security control

-- Enable RLS on the table
ALTER TABLE student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT operations
CREATE POLICY "Allow profile SELECT" ON student_ai_profile
FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for INSERT operations
CREATE POLICY "Allow profile INSERT" ON student_ai_profile
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for UPDATE operations
CREATE POLICY "Allow profile UPDATE" ON student_ai_profile
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for DELETE operations
CREATE POLICY "Allow profile DELETE" ON student_ai_profile
FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- OPTION 3: ANONYMOUS ACCESS FIX - For API endpoints that need anonymous access
-- =============================================================================
-- This option allows anonymous read access for public API endpoints
-- Good for: Public APIs, read-only access patterns

-- Drop the comprehensive policies if they were created
DROP POLICY IF EXISTS "Allow profile SELECT" ON student_ai_profile;
DROP POLICY IF EXISTS "Allow profile INSERT" ON student_ai_profile;
DROP POLICY IF EXISTS "Allow profile UPDATE" ON student_ai_profile;
DROP POLICY IF EXISTS "Allow profile DELETE" ON student_ai_profile;
DROP POLICY IF EXISTS "Simple profile access" ON student_ai_profile;

-- Create a policy that allows both authenticated and anonymous read access
CREATE POLICY "Public read, authenticated write" ON student_ai_profile
FOR ALL
USING (
  -- Allow anonymous read access
  (auth.uid() IS NULL AND auth.jwt() IS NULL) OR
  -- Allow users to access their own data
  auth.uid() = user_id OR
  -- Allow service role full access
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  -- Only allow writes for authenticated users
  auth.uid() = user_id OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON student_ai_profile TO authenticated;

-- Grant permissions to service role
GRANT ALL ON student_ai_profile TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Grant anon role read access (needed for API calls)
GRANT SELECT ON student_ai_profile TO anon;

-- =============================================================================
-- VERIFICATION AND TESTING
-- =============================================================================

-- Check current policies
SELECT 
  'Current RLS policies on student_ai_profile:' as info;
  
SELECT 
  policyname, 
  cmd, 
  permissive, 
  roles 
FROM pg_policies 
WHERE tablename = 'student_ai_profile'
ORDER BY policyname;

-- Check RLS status
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'student_ai_profile';

-- Check table permissions
SELECT 
  'Table permissions:' as info,
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'student_ai_profile'
ORDER BY grantee, privilege_type;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================
-- To rollback to a previous state, you can:
-- 1. Drop all policies: DROP POLICY IF EXISTS ... ON student_ai_profile; (run for each policy)
-- 2. Disable RLS: ALTER TABLE student_ai_profile DISABLE ROW LEVEL SECURITY;
-- 3. Re-run your original migration/script

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================
-- 1. Choose ONE of the three options above (comment out the others)
-- 2. Run the entire file - it will safely drop existing policies first
-- 3. Verify the results using the verification queries
-- 4. Test your application to ensure it works correctly

-- =============================================================================
-- TROUBLESHOOTING
-- =============================================================================
-- If you still get errors:
-- 1. Check the verification queries above for policy status
-- 2. Ensure your user_id field matches the auth.uid() format
-- 3. Verify your JWT tokens include the proper role claims
-- 4. Check that RLS is actually enabled on the table

-- End of corrected RLS fix