-- Unify ai_suggestions schema across legacy and modern variants
-- This migration adds missing columns from both schemas, backfills values, and
-- creates consistency triggers and helpful indexes.

BEGIN;

-- 1) Ensure table exists with a minimal shape; if not, create with unified schema
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  -- Legacy columns
  title text,
  description text,
  priority text CHECK (priority IN ('low','medium','high')),
  estimated_impact integer DEFAULT 5,
  reasoning text,
  actionable_steps jsonb,
  related_topics jsonb,
  confidence_score numeric(3,2) DEFAULT 0.5,
  metadata jsonb,
  is_active boolean DEFAULT true,
  is_applied boolean DEFAULT false,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '6 hours'),
  suggestion_type text,
  -- Modern columns
  suggestion_title text,
  suggestion_content text,
  suggestion_data jsonb DEFAULT '{}'::jsonb,
  is_viewed boolean DEFAULT false,
  is_accepted boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  category text DEFAULT 'general',
  -- Compatibility helpers
  priority_int integer DEFAULT 3,
  priority_text text DEFAULT 'medium'
);

-- 2) Add columns that may be missing depending on current variant
DO $$
BEGIN
  -- Legacy fields (if table was modern-only)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='title'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN title text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='description'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='priority'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN priority text;
    ALTER TABLE public.ai_suggestions ADD CONSTRAINT ai_suggestions_priority_chk CHECK (priority IN ('low','medium','high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='estimated_impact'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN estimated_impact integer DEFAULT 5;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='reasoning'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN reasoning text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='actionable_steps'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN actionable_steps jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='related_topics'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN related_topics jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='confidence_score'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN confidence_score numeric(3,2) DEFAULT 0.5;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='metadata'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN metadata jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='is_active'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='is_applied'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN is_applied boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='applied_at'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN applied_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='expires_at'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '6 hours');
  END IF;

  -- Modern fields (if table was legacy-only)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='suggestion_title'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN suggestion_title text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='suggestion_content'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN suggestion_content text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='suggestion_data'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN suggestion_data jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='is_viewed'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN is_viewed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='is_accepted'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN is_accepted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='is_dismissed'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN is_dismissed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='category'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN category text DEFAULT 'general';
  END IF;

  -- Helper/compat columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='priority_int'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN priority_int integer DEFAULT 3;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='priority_text'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN priority_text text DEFAULT 'medium';
  END IF;
END$$;

-- 3) Backfill: prefer keeping both title/description variants in sync
UPDATE public.ai_suggestions
SET 
  title = COALESCE(title, suggestion_title),
  suggestion_title = COALESCE(suggestion_title, title),
  description = COALESCE(description, suggestion_content),
  suggestion_content = COALESCE(suggestion_content, description)
WHERE title IS NULL OR suggestion_title IS NULL OR description IS NULL OR suggestion_content IS NULL;

-- 4) Backfill: priority helpers based on existing priority if present
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='ai_suggestions' AND column_name='priority';

  IF col_type IS NOT NULL THEN
    IF col_type IN ('integer','bigint','smallint') THEN
      UPDATE public.ai_suggestions
      SET priority_int = COALESCE(priority_int, priority),
          priority_text = COALESCE(priority_text, CASE 
            WHEN priority >= 4 THEN 'high'
            WHEN priority = 3 THEN 'medium'
            ELSE 'low' END);
    ELSE
      -- treat as text
      UPDATE public.ai_suggestions
      SET priority_text = COALESCE(priority_text, lower(priority)),
          priority_int = COALESCE(priority_int, CASE 
            WHEN lower(priority) = 'high' THEN 5
            WHEN lower(priority) = 'medium' THEN 3
            WHEN lower(priority) = 'low' THEN 1
            ELSE 3 END);
    END IF;
  END IF;
END$$;

-- 5) Consistency trigger: keep is_active and is_dismissed in sync
CREATE OR REPLACE FUNCTION public.sync_active_dismissed()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_dismissed IS TRUE THEN
    NEW.is_active := FALSE;
  END IF;
  IF NEW.is_active IS FALSE THEN
    NEW.is_dismissed := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_active_dismissed ON public.ai_suggestions;
CREATE TRIGGER trg_sync_active_dismissed
BEFORE INSERT OR UPDATE ON public.ai_suggestions
FOR EACH ROW EXECUTE FUNCTION public.sync_active_dismissed();

-- 6) Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.ai_suggestions;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON public.ai_suggestions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_not_dismissed ON public.ai_suggestions(user_id, is_dismissed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_active ON public.ai_suggestions(user_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_expires_at ON public.ai_suggestions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON public.ai_suggestions(suggestion_type);

COMMIT;
