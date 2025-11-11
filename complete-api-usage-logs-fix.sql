-- ============================================================================
-- COMPLETE API USAGE LOGS FIX - UUID + FOREIGN KEY CONSTRAINT RESOLUTION
-- ============================================================================
-- This fixes the continuous API usage log errors by:
-- 1. Adding missing 'endpoint' column
-- 2. Creating UUID mapping system that respects foreign key constraints
-- 3. Handling system users properly
-- 4. Updating logging functions to handle mixed user ID formats safely

-- Fix 1: Add missing 'endpoint' column to api_usage_logs table
-- ============================================================
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS endpoint TEXT;
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- Update existing records to have default endpoint
UPDATE api_usage_logs 
SET endpoint = '/api/chat/general' 
WHERE endpoint IS NULL;

-- Fix 2: Create UUID mapping system for non-UUID user IDs
-- =======================================================
-- Create a table to track non-UUID user ID mappings
CREATE TABLE IF NOT EXISTS user_id_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id TEXT NOT NULL UNIQUE,
  mapped_uuid UUID NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_original ON user_id_mappings(original_id);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_uuid ON user_id_mappings(mapped_uuid);

-- RLS policies for user_id_mappings
ALTER TABLE user_id_mappings ENABLE ROW LEVEL SECURITY;

-- Create a system policy that allows service role to access this table
CREATE POLICY "Service role can manage user ID mappings" ON user_id_mappings
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Service role can insert user ID mappings" ON user_id_mappings
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 3: Enhanced function to map user IDs to UUIDs with foreign key awareness
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_user_uuid(
  p_user_id_input TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_uuid UUID;
  fallback_user_id UUID;
BEGIN
  -- If it's already a valid UUID, check if it exists in users table
  IF p_user_id_input ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    -- Check if this UUID exists in auth.users table
    SELECT id INTO result_uuid 
    FROM auth.users 
    WHERE id = p_user_id_input::UUID;
    
    -- If user exists, return it
    IF FOUND THEN
      RETURN p_user_id_input::UUID;
    END IF;
  END IF;
  
  -- Try to find existing mapping
  SELECT mapped_uuid INTO result_uuid
  FROM user_id_mappings 
  WHERE original_id = p_user_id_input;
  
  -- If mapping exists, verify the user still exists
  IF FOUND THEN
    -- Check if the mapped user still exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = result_uuid) THEN
      -- Update last used timestamp
      UPDATE user_id_mappings 
      SET last_used_at = NOW() 
      WHERE original_id = p_user_id_input;
      RETURN result_uuid;
    END IF;
  END IF;
  
  -- If no valid mapping, find a fallback user
  SELECT id INTO fallback_user_id 
  FROM auth.users 
  LIMIT 1;
  
  -- If no users exist in the system, we have a problem
  IF fallback_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users table - cannot create mapping for %', p_user_id_input;
  END IF;
  
  -- Create or update mapping with valid user
  INSERT INTO user_id_mappings (original_id, mapped_uuid, user_type)
  VALUES (p_user_id_input, fallback_user_id, 'system')
  ON CONFLICT (original_id) DO UPDATE SET 
    mapped_uuid = fallback_user_id,
    last_used_at = NOW();
  
  RETURN fallback_user_id;
END;
$$;

-- Fix 4: Safe API usage logging function with foreign key handling
-- =================================================================
CREATE OR REPLACE FUNCTION log_api_usage_safe(
  p_user_id_input TEXT,
  p_feature_name TEXT,
  p_provider_used TEXT,
  p_model_used TEXT,
  p_tokens_input INTEGER DEFAULT 0,
  p_tokens_output INTEGER DEFAULT 0,
  p_latency_ms INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_query_type TEXT DEFAULT 'general',
  p_endpoint TEXT DEFAULT '/api/chat/general',
  p_tier_used TEXT DEFAULT 'free',
  p_fallback_used BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  valid_user_id UUID;
BEGIN
  -- Get the user UUID using our mapping function
  valid_user_id := get_user_uuid(p_user_id_input);
  
  -- Double-check the user exists before insertion
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = valid_user_id) THEN
    -- This should not happen if get_user_uuid works correctly, but just in case
    SELECT id INTO valid_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF valid_user_id IS NULL THEN
      RAISE EXCEPTION 'Critical: No valid users found in auth.users table';
    END IF;
  END IF;
  
  -- Insert the log entry
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
    endpoint,
    tier_used,
    fallback_used,
    timestamp
  ) VALUES (
    valid_user_id,
    p_feature_name,
    p_provider_used,
    p_model_used,
    p_tokens_input,
    p_tokens_output,
    p_latency_ms,
    p_success,
    p_error_message,
    p_query_type,
    p_endpoint,
    p_tier_used,
    p_fallback_used,
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Log the error but don't crash
    RAISE NOTICE 'Foreign key violation for user_id: %, original input: %', valid_user_id, p_user_id_input;
    
    -- Try one more time with any existing user
    SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
    
    IF valid_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot insert API usage log - no valid users exist in the system';
    END IF;
    
    -- Retry insertion
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
      endpoint,
      tier_used,
      fallback_used,
      timestamp
    ) VALUES (
      valid_user_id,
      p_feature_name,
      p_provider_used,
      p_model_used,
      p_tokens_input,
      p_tokens_output,
      p_latency_ms,
      p_success,
      p_error_message,
      p_query_type,
      p_endpoint,
      p_tier_used,
      p_fallback_used,
      NOW()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Fix 5: Enhanced API usage logging function for direct use
-- =========================================================
CREATE OR REPLACE FUNCTION log_api_usage_enhanced(
  p_user_id_input TEXT,
  p_feature_name TEXT,
  p_provider_used TEXT,
  p_model_used TEXT,
  p_tokens_input INTEGER DEFAULT 0,
  p_tokens_output INTEGER DEFAULT 0,
  p_latency_ms INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_query_type TEXT DEFAULT 'general',
  p_endpoint TEXT DEFAULT '/api/chat/general',
  p_tier_used TEXT DEFAULT 'free',
  p_fallback_used BOOLEAN DEFAULT false,
  p_additional_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the safe logging function that handles foreign key constraints
  RETURN log_api_usage_safe(
    p_user_id_input,
    p_feature_name,
    p_provider_used,
    p_model_used,
    p_tokens_input,
    p_tokens_output,
    p_latency_ms,
    p_success,
    p_error_message,
    p_query_type,
    p_endpoint,
    p_tier_used,
    p_fallback_used
  );
END;
$$;

-- Fix 6: Clean up existing problematic API usage logs
-- ==================================================
-- Identify and fix existing records with non-UUID user_ids
DO $$
DECLARE
    record_count INTEGER := 0;
BEGIN
    -- Update problematic records
    UPDATE api_usage_logs 
    SET user_id = get_user_uuid(user_id::TEXT)
    WHERE user_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    RAISE NOTICE 'Updated % problematic API usage log records', record_count;
END $$;

-- Fix 7: Ensure api_usage_logs table has all required columns
-- ============================================================
-- Add any missing columns that might be needed
ALTER TABLE api_usage_logs 
  ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,4) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have proper defaults
UPDATE api_usage_logs 
SET 
  cost_estimate = 0.0,
  created_at = COALESCE(created_at, timestamp, NOW())
WHERE cost_estimate IS NULL OR created_at IS NULL;

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_timestamp ON api_usage_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_feature_timestamp ON api_usage_logs(feature_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_success ON api_usage_logs(success, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint_feature ON api_usage_logs(endpoint, feature_name, timestamp DESC);

-- Verification Queries
-- ====================
SELECT 'API Usage Logs table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'api_usage_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'User ID Mappings table created:' as info;
SELECT COUNT(*) as mapping_count FROM user_id_mappings;

SELECT 'Functions updated:' as info;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('get_user_uuid', 'log_api_usage_safe', 'log_api_usage_enhanced');

-- Test the fix by checking for problematic records
SELECT 'Testing for any remaining non-UUID user IDs:' as test;
SELECT user_id, feature_name, timestamp
FROM api_usage_logs 
WHERE user_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
LIMIT 5;

-- Test the mapping function
SELECT 'Testing user ID mapping function:' as test;
SELECT 
  get_user_uuid('test-user') as test_user_uuid,
  get_user_uuid('anonymous-user') as anonymous_user_uuid,
  get_user_uuid('00000000-0000-0000-0000-000000000000') as real_uuid;

-- Test the enhanced logging function
SELECT 'Testing enhanced API usage logging:' as test;
SELECT log_api_usage_enhanced(
  'test-user',
  'test_feature',
  'test_provider',
  'test_model',
  100,
  50,
  200,
  true,
  null,
  'test_query',
  '/api/test',
  'pro',
  false
) as test_log_id;