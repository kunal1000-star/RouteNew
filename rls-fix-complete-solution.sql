-- Complete RLS Fix for student_ai_profile - Final Solution
-- This migration addresses the specific RLS policy violation that occurs during trigger execution

BEGIN;

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Triggers (postgres) can manage profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Users can SELECT own profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Users can INSERT own profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Users can UPDATE own profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Users can DELETE own profile" ON public.student_ai_profile;

-- Step 2: Create comprehensive policies that work with triggers
-- These policies allow operations both when called directly by users AND when called by triggers
-- The key insight is that triggers run with the same security context as the triggering operation

CREATE POLICY "Enable all operations for users on their own data" ON public.student_ai_profile
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alternative: If the above doesn't work due to trigger context issues, use this more permissive approach
-- This allows any authenticated user to perform operations, with the constraint that they can only
-- access rows where user_id matches their auth.uid() when doing direct queries

-- CREATE POLICY "Enable read for users on their own data" ON public.student_ai_profile
--   FOR SELECT
--   USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Enable insert for service role and user context" ON public.student_ai_profile
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
-- 
-- CREATE POLICY "Enable update for service role and user context" ON public.student_ai_profile
--   FOR UPDATE
--   USING (auth.uid() = user_id OR auth.role() = 'service_role')
--   WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Step 3: Ensure the table has the required structure
-- Add missing columns if they don't exist
ALTER TABLE public.student_ai_profile 
  ADD COLUMN IF NOT EXISTS profile_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_ai_interaction TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ai_interaction_count INTEGER DEFAULT 0;

-- Step 4: Create/update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS during trigger execution
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from the conversation
  SELECT cc.user_id INTO v_user_id
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'No user found for conversation_id: %', NEW.conversation_id;
    RETURN NEW;
  END IF;

  -- Perform the upsert operation
  -- This will run with SECURITY DEFINER privileges, so it can bypass RLS
  INSERT INTO public.student_ai_profile (user_id, profile_text, last_ai_interaction, ai_interaction_count)
  VALUES (v_user_id, COALESCE('', ''), NOW(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_text = COALESCE(public.student_ai_profile.profile_text, ''),
    last_ai_interaction = NOW(),
    ai_interaction_count = COALESCE(public.student_ai_profile.ai_interaction_count, 0) + 1;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in update_last_ai_interaction trigger: %', SQLERRM;
  RETURN NEW;  -- Continue processing even if the trigger fails
END;
$$;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;
CREATE TRIGGER trg_update_last_ai_interaction
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_ai_interaction();

-- Step 6: Ensure proper indexing
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_ai_profile_user_id
  ON public.student_ai_profile(user_id);

COMMIT;

-- Verification queries (run these after applying the migration)
-- SELECT * FROM pg_policies WHERE tablename = 'student_ai_profile';
-- SELECT routine_name, routine_definition FROM information_schema.routines 
-- WHERE routine_name = 'update_last_ai_interaction';
