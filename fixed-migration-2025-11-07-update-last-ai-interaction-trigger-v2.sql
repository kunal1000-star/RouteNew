-- Update trigger to maintain both last_ai_interaction and ai_interaction_count

BEGIN;

CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger AS $$
BEGIN
  UPDATE public.student_ai_profile sap
  SET last_ai_interaction = NOW(),
      ai_interaction_count = COALESCE(sap.ai_interaction_count, 0) + 1
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id
    AND sap.user_id = cc.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
