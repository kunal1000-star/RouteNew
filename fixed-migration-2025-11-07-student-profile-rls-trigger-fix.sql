-- Ensure trigger function can update/insert student_ai_profile under RLS
-- Strategy: SECURITY DEFINER function owned by postgres + RLS policy TO postgres
-- Also ensure a unique index on user_id for upsert

BEGIN;

-- Unique index for upsert (safe if PK already exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_ai_profile_user_id
  ON public.student_ai_profile(user_id);

-- Recreate function with SECURITY DEFINER and upsert logic
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the user who owns the conversation
  SELECT cc.user_id INTO v_user_id
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id;

  IF v_user_id IS NULL THEN
    RETURN NEW; -- nothing to do
  END IF;

  -- Upsert the student's AI profile
  INSERT INTO public.student_ai_profile AS sap (user_id, last_ai_interaction, ai_interaction_count)
  VALUES (v_user_id, NOW(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_ai_interaction = NOW(),
    ai_interaction_count = COALESCE(sap.ai_interaction_count, 0) + 1;

  RETURN NEW;
END;
$$;

-- Create a permissive policy for postgres role to allow trigger operations
DROP POLICY IF EXISTS "Triggers (postgres) can manage profile" ON public.student_ai_profile;
CREATE POLICY "Triggers (postgres) can manage profile" ON public.student_ai_profile
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

COMMIT;
