-- Explicit RLS policies for student_ai_profile and safer trigger behavior
-- This migration:
-- 1) Replaces generic FOR ALL policy with explicit SELECT/INSERT/UPDATE/DELETE policies
-- 2) Removes postgres-only policy so user session policies are used
-- 3) Recreates trigger function without SECURITY DEFINER so it runs as session user
--    ensuring RLS checks apply to the end-user (auth.uid())

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Drop previous generic and postgres policies if present
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.student_ai_profile;
DROP POLICY IF EXISTS "Triggers (postgres) can manage profile" ON public.student_ai_profile;

-- Create explicit policies
-- SELECT: users can read only their own row
DROP POLICY IF EXISTS "Users can SELECT own profile" ON public.student_ai_profile;
CREATE POLICY "Users can SELECT own profile" ON public.student_ai_profile
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can insert only their own row
DROP POLICY IF EXISTS "Users can INSERT own profile" ON public.student_ai_profile;
CREATE POLICY "Users can INSERT own profile" ON public.student_ai_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update only their own row
DROP POLICY IF EXISTS "Users can UPDATE own profile" ON public.student_ai_profile;
CREATE POLICY "Users can UPDATE own profile" ON public.student_ai_profile
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can delete only their own row (not used, but for completeness)
DROP POLICY IF EXISTS "Users can DELETE own profile" ON public.student_ai_profile;
CREATE POLICY "Users can DELETE own profile" ON public.student_ai_profile
  FOR DELETE
  USING (auth.uid() = user_id);

-- Recreate function WITHOUT SECURITY DEFINER to evaluate RLS as the session user
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT cc.user_id INTO v_user_id
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert with explicit profile_text fallback to satisfy NOT NULL
  INSERT INTO public.student_ai_profile AS sap (user_id, profile_text, last_ai_interaction, ai_interaction_count)
  VALUES (v_user_id, COALESCE('', ''), NOW(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_text = COALESCE(sap.profile_text, ''),
    last_ai_interaction = NOW(),
    ai_interaction_count = COALESCE(sap.ai_interaction_count, 0) + 1;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;
CREATE TRIGGER trg_update_last_ai_interaction
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_ai_interaction();

COMMIT;
