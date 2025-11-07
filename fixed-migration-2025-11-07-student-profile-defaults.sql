-- Ensure student_ai_profile.profile_text always has a non-null value
-- Adds a default '' and backfills existing NULLs

BEGIN;

-- Backfill any existing NULLs just in case
UPDATE public.student_ai_profile
SET profile_text = ''
WHERE profile_text IS NULL;

-- Set default for future inserts
ALTER TABLE public.student_ai_profile
ALTER COLUMN profile_text SET DEFAULT '';

COMMIT;
