-- Permanent solution: remove trigger, add SECURITY DEFINER RPC to update profile
-- Safe to run multiple times

BEGIN;

-- 1) Drop trigger to avoid hidden RLS issues and double updates
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;

-- 2) Ensure helper policy for postgres (function owner) exists
DROP POLICY IF EXISTS "System (postgres) can manage profile" ON public.student_ai_profile;
CREATE POLICY "System (postgres) can manage profile" ON public.student_ai_profile
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- 3) Create SECURITY DEFINER RPC to update profile atomically
CREATE OR REPLACE FUNCTION public.update_student_ai_profile(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.student_ai_profile AS sap (user_id, profile_text, last_ai_interaction, ai_interaction_count)
  VALUES (uid, '', NOW(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_text = COALESCE(sap.profile_text, ''),
    last_ai_interaction = NOW(),
    ai_interaction_count = COALESCE(sap.ai_interaction_count, 0) + 1;
END;
$$;

-- 4) Attempt to set function owner to postgres (best-effort)
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.update_student_ai_profile(uid uuid) OWNER TO postgres;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;

-- 5) Grant execute to authenticated/anon so API can call it using user session
GRANT EXECUTE ON FUNCTION public.update_student_ai_profile(uid uuid) TO anon, authenticated;

COMMIT;
