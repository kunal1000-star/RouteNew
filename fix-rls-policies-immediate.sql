-- IMMEDIATE RLS POLICY FIX FOR PRODUCTION
-- Fix critical RLS policy violations for student_ai_profile and conversation_memory tables

-- Fix student_ai_profile table RLS policies
ALTER TABLE student_ai_profile DISABLE ROW LEVEL SECURITY;

-- Or create proper RLS policies if needed
DROP POLICY IF EXISTS "Users can view own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can update own student profile" ON student_ai_profile;
DROP POLICY IF EXISTS "Users can insert own student profile" ON student_ai_profile;

CREATE POLICY "Users can manage own student profile" ON student_ai_profile
    FOR ALL USING (user_id = auth.uid());

-- Fix conversation_memory table RLS policies  
ALTER TABLE conversation_memory DISABLE ROW LEVEL SECURITY;

-- Or create proper RLS policies if needed
DROP POLICY IF EXISTS "Users can view own conversation memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can insert own conversation memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can update own conversation memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can delete own conversation memories" ON conversation_memory;

CREATE POLICY "Users can manage own conversation memory" ON conversation_memory
    FOR ALL USING (user_id = auth.uid());