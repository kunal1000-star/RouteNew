-- Final hardened setup: SECURITY DEFINER trigger owned by postgres with permissive policy
-- Safe to run multiple times

BEGIN;

-- Ensure RLS is enabled on the target table
ALTER TABLE public.student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Make sure there is a unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_ai_profile_user_id
  ON public.student_ai_profile(user_id);

-- Create/replace a permissive policy for the postgres role (function owner)
DROP POLICY IF EXISTS "Triggers (postgres) can manage profile" ON public.student_ai_profile;
CREATE POLICY "Triggers (postgres) can manage profile" ON public.student_ai_profile
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Recreate the function as SECURITY DEFINER and ensure it runs under table owner
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Map conversation to its owning user
  SELECT cc.user_id INTO v_user_id
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert profile row; ensure NOT NULL profile_text and update activity metrics
  INSERT INTO public.student_ai_profile AS sap (user_id, profile_text, last_ai_interaction, ai_interaction_count)
  VALUES (v_user_id, '', NOW(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_text = COALESCE(sap.profile_text, ''),
    last_ai_interaction = NOW(),
    ai_interaction_count = COALESCE(sap.ai_interaction_count, 0) + 1;

  RETURN NEW;
END;
$$;

-- Attempt to set ownership to postgres (on Supabase, this typically succeeds when run in SQL editor)
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.update_last_ai_interaction() OWNER TO postgres;
  EXCEPTION WHEN insufficient_privilege THEN
    -- Ignore if the executor cannot change owner; function will still be SECURITY DEFINER
    NULL;
  END;
END $$;

-- Recreate trigger to ensure it points to the updated function
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;
CREATE TRIGGER trg_update_last_ai_interaction
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_ai_interaction();

COMMIT;
