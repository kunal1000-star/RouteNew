-- Fix RLS policies for student_ai_profile table
-- This addresses the "new row violates row-level security policy" error
-- Issue 5: Database RLS Policy for Student Profiles

-- Drop existing policies that might be causing conflicts
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
-- Policy 1: Allow users to read their own profiles
CREATE POLICY "Users can read their own student profile" 
ON student_ai_profile FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Allow users to insert their own profiles (for profile creation)
CREATE POLICY "Users can create their own student profile" 
ON student_ai_profile FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own profiles
CREATE POLICY "Users can update their own student profile" 
ON student_ai_profile FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own profiles
CREATE POLICY "Users can delete their own student profile" 
ON student_ai_profile FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON student_ai_profile TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Also fix the api_usage_logs table for Issue 1
-- Add tier_used column if it doesn't exist
ALTER TABLE api_usage_logs 
ADD COLUMN IF NOT EXISTS tier_used TEXT DEFAULT 'free';

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tier_used 
ON api_usage_logs(tier_used);

-- Update any existing records to have a default tier
UPDATE api_usage_logs 
SET tier_used = 'free' 
WHERE tier_used IS NULL;

-- Verification queries
SELECT 'student_ai_profile RLS policies created:' as status;
SELECT policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'student_ai_profile';

SELECT 'api_usage_logs table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'api_usage_logs' 
AND table_schema = 'public'
AND column_name = 'tier_used';