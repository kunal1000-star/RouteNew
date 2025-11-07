-- Add missing last_ai_interaction column to student_ai_profile to fix runtime errors
-- Safe for repeated runs

BEGIN;

ALTER TABLE IF EXISTS public.student_ai_profile
  ADD COLUMN IF NOT EXISTS last_ai_interaction timestamptz;

COMMIT;
