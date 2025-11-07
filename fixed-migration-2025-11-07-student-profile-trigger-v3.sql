-- Make trigger upsert resilient to NOT NULL profile_text by explicitly setting it

BEGIN;

CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMIT;
