-- Remove any and all triggers on chat_messages to stop unintended writes to student_ai_profile
-- Safe to run multiple times

BEGIN;

-- Drop all triggers on public.chat_messages dynamically
DO $$
DECLARE
  trg RECORD;
BEGIN
  FOR trg IN
    SELECT tg.tgname
    FROM pg_trigger tg
    JOIN pg_class tbl ON tbl.oid = tg.tgrelid
    JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
    WHERE ns.nspname = 'public'
      AND tbl.relname = 'chat_messages'
      AND NOT tg.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.chat_messages;', trg.tgname);
  END LOOP;
END $$;

-- Optionally drop known helper function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_last_ai_interaction'
  ) THEN
    EXECUTE 'DROP FUNCTION public.update_last_ai_interaction()';
  END IF;
END $$;

COMMIT;
