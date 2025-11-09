-- Activity Logs Schema Fix
-- Adds the missing 'details' column to activity_logs table
-- Safe to run multiple times

DO $$
BEGIN
  -- Check if activity_logs table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    -- Create activity_logs table with all required columns
    CREATE TABLE public.activity_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      details JSONB DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
  ELSE
    -- Add missing details column if table exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'details'
    ) THEN
      ALTER TABLE public.activity_logs ADD COLUMN details JSONB DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Verification query
SELECT 
  'activity_logs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'activity_logs'
  AND column_name IN ('details', 'user_id', 'activity_type', 'summary', 'created_at')
ORDER BY column_name;