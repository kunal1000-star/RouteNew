-- Add missing tier_used column to api_usage_logs table
-- ===================================================

-- Add the tier_used column if it doesn't exist
ALTER TABLE api_usage_logs 
ADD COLUMN IF NOT EXISTS tier_used TEXT DEFAULT 'free';

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tier_used 
ON api_usage_logs(tier_used);

-- Update any existing records to have a default tier
UPDATE api_usage_logs 
SET tier_used = 'free' 
WHERE tier_used IS NULL;

-- Update the log_api_usage function to include tier_used parameter
CREATE OR REPLACE FUNCTION log_api_usage(
  p_user_id UUID,
  p_feature_name TEXT,
  p_provider_used TEXT,
  p_model_used TEXT,
  p_tokens_input INTEGER DEFAULT 0,
  p_tokens_output INTEGER DEFAULT 0,
  p_latency_ms INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_query_type TEXT DEFAULT 'general',
  p_tier_used TEXT DEFAULT 'free'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO api_usage_logs (
    user_id,
    feature_name,
    provider_used,
    model_used,
    tokens_input,
    tokens_output,
    latency_ms,
    success,
    error_message,
    query_type,
    tier_used
  ) VALUES (
    p_user_id,
    p_feature_name,
    p_provider_used,
    p_model_used,
    p_tokens_input,
    p_tokens_output,
    p_latency_ms,
    p_success,
    p_error_message,
    p_query_type,
    p_tier_used
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Verify the table structure
SELECT 'api_usage_logs table structure after tier_used column addition:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'api_usage_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;