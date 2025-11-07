-- Add missing ai_interaction_count column to student_ai_profile
-- Safe for repeated runs

BEGIN;

ALTER TABLE IF EXISTS public.student_ai_profile
  ADD COLUMN IF NOT EXISTS ai_interaction_count integer NOT NULL DEFAULT 0;

COMMIT;
