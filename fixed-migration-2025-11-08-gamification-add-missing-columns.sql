-- Gamification schema hardening migration
-- Ensures user_gamification table exists with all required columns
-- Safe to run multiple times

DO $$
BEGIN
  -- Create table if not exists with required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_gamification'
  ) THEN
    CREATE TABLE public.user_gamification (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_points_earned INTEGER DEFAULT 0,
      total_penalty_points INTEGER DEFAULT 0,
      experience_points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      current_level INTEGER DEFAULT 1,
      total_topics_completed INTEGER DEFAULT 0,
      badges_earned JSONB DEFAULT '[]'::jsonb,
      last_activity_date TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Add missing columns defensively
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'total_points_earned'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN total_points_earned INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'total_penalty_points'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN total_penalty_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'experience_points'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN experience_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN level INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'current_level'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN current_level INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN longest_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'total_topics_completed'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN total_topics_completed INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'badges_earned'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN badges_earned JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN last_activity_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON public.user_gamification(level);
CREATE INDEX IF NOT EXISTS idx_user_gamification_activity ON public.user_gamification(last_activity_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_gamification_set_updated_at ON public.user_gamification;
CREATE TRIGGER trg_user_gamification_set_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
