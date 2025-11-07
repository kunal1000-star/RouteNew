-- Trigger function that updates student_ai_profile using auth.uid() to satisfy RLS
-- Safe to run multiple times

BEGIN;

-- Ensure RLS remains enabled (no-op if already)
ALTER TABLE public.student_ai_profile ENABLE ROW LEVEL SECURITY;

-- Ensure unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_ai_profile_user_id
  ON public.student_ai_profile(user_id);

-- Recreate function to run as session user (no SECURITY DEFINER)
-- Uses auth.uid() so INSERT/UPDATE policies with (auth.uid() = user_id) pass
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use the current session user id for RLS-friendly upsert
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    -- Fallback: if there is no authenticated user in this context, do nothing
    RETURN NEW;
  END IF;

  -- Upsert the profile row for the current user
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

-- Recreate trigger to ensure it points to the updated function
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;
CREATE TRIGGER trg_update_last_ai_interaction
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_ai_interaction();

COMMIT;
