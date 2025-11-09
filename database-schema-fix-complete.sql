-- Complete Database Schema Fix Migration
-- Addresses all 3 critical errors from the console logs
-- Safe to run multiple times

-- ============================================================================
-- FIX 1: GAMIFICATION SCHEMA - Add missing columns to user_gamification table
-- ============================================================================

DO $$
BEGIN
  -- Create user_gamification table if not exists
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
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'total_penalty_points'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN total_penalty_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN level INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'experience_points'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN experience_points INTEGER DEFAULT 0;
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
    WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'total_points_earned'
  ) THEN
    ALTER TABLE public.user_gamification ADD COLUMN total_points_earned INTEGER DEFAULT 0;
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

-- ============================================================================
-- FIX 2: ACTIVITY LOGS SCHEMA - Add missing details column
-- ============================================================================

DO $$
BEGIN
  -- Create activity_logs table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    CREATE TABLE public.activity_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      details JSONB DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Add missing details column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'details'
  ) THEN
    ALTER TABLE public.activity_logs ADD COLUMN details JSONB DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- FIX 3: BLOCKS TABLE TIME COLUMNS - Ensure proper TIME format support
-- ============================================================================

-- Update blocks table to support proper time handling
DO $$
BEGIN
  -- Check if start_time column exists and is proper type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'blocks' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.blocks ADD COLUMN start_time TIME DEFAULT '09:00:00';
  END IF;

  -- Ensure end_time column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'blocks' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE public.blocks ADD COLUMN end_time TIME DEFAULT '10:00:00';
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES AND TRIGGERS
-- ============================================================================

-- User gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON public.user_gamification(level);
CREATE INDEX IF NOT EXISTS idx_user_gamification_activity ON public.user_gamification(last_activity_date);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Blocks indexes
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON public.blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_date ON public.blocks(date);
CREATE INDEX IF NOT EXISTS idx_blocks_start_time ON public.blocks(start_time);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User gamification trigger
DROP TRIGGER IF EXISTS trg_user_gamification_set_updated_at ON public.user_gamification;
CREATE TRIGGER trg_user_gamification_set_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activity logs trigger (if needed)
DROP TRIGGER IF EXISTS trg_activity_logs_set_updated_at ON public.activity_logs;
CREATE TRIGGER trg_activity_logs_set_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Blocks trigger
DROP TRIGGER IF EXISTS trg_blocks_set_updated_at ON public.blocks;
CREATE TRIGGER trg_blocks_set_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify the fixes by checking table structures
SELECT 
  'user_gamification' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_gamification'
  AND column_name IN ('total_penalty_points', 'level', 'experience_points')
UNION ALL
SELECT 
  'activity_logs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'activity_logs'
  AND column_name = 'details'
ORDER BY table_name, column_name;