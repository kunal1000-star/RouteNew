-- Keep student_ai_profile.last_ai_interaction up to date from chat activity
-- Safe to re-run

BEGIN;

-- Function to update last_ai_interaction when a new chat message is inserted
CREATE OR REPLACE FUNCTION public.update_last_ai_interaction()
RETURNS trigger AS $$
BEGIN
  -- Update the student profile for the user who owns the conversation
  UPDATE public.student_ai_profile sap
  SET last_ai_interaction = NOW()
  FROM public.chat_conversations cc
  WHERE cc.id = NEW.conversation_id
    AND sap.user_id = cc.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_update_last_ai_interaction ON public.chat_messages;
CREATE TRIGGER trg_update_last_ai_interaction
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_ai_interaction();

COMMIT;
