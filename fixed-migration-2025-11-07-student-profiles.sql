-- Create student_profiles table compatible with API expectations
-- Fields used in code: user_id (UUID), performance_data (jsonb), historical_data (jsonb)
-- Adds RLS and indexes for performance and security

BEGIN;

CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_data jsonb DEFAULT '{}'::jsonb,
  historical_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_profiles' AND policyname = 'Users can view their own student profile'
  ) THEN
    CREATE POLICY "Users can view their own student profile" ON public.student_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_profiles' AND policyname = 'Users can insert their own student profile'
  ) THEN
    CREATE POLICY "Users can insert their own student profile" ON public.student_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_profiles' AND policyname = 'Users can update their own student profile'
  ) THEN
    CREATE POLICY "Users can update their own student profile" ON public.student_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_student_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER trg_set_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_student_profiles_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);

COMMIT;
