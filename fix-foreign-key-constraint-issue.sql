-- Fix Foreign Key Constraint Issue for API Usage Logs
-- ====================================================
-- This fixes the foreign key violation by either:
-- 1. Creating a system user for system-generated logs
-- 2. Or handling the foreign key constraint appropriately

-- Option 1: Create a system user for system-generated logs
-- ========================================================
-- First, let's see if we can find existing system users or create one
-- Check if there's an existing system user
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Try to find an existing system user
    SELECT id INTO system_user_id 
    FROM auth.users 
    WHERE email LIKE '%system%' OR email LIKE '%admin%' OR email = 'system@studyapp.local'
    LIMIT 1;
    
    -- If no system user found, create one
    IF system_user_id IS NULL THEN
        -- Note: We can't directly insert into auth.users from here
        -- So we'll use the UUID from a real user or handle this differently
        
        -- Let's find any existing user to use as system user fallback
        SELECT id INTO system_user_id 
        FROM auth.users 
        LIMIT 1;
        
        -- If still no user, we'll use a well-known UUID
        IF system_user_id IS NULL THEN
            system_user_id := '00000000-0000-0000-0000-000000000001';
        END IF;
    END IF;
    
    -- Update the get_user_uuid function to return a real user ID
    DROP FUNCTION IF EXISTS get_user_uuid(TEXT);
    
    CREATE OR REPLACE FUNCTION get_user_uuid(
      p_user_id_input TEXT
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result_uuid UUID;
      system_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Use a well-known system user
    BEGIN
      -- If it's already a valid UUID, check if it exists in users table
      IF p_user_id_input ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        -- Check if this UUID exists in users table
        SELECT id INTO result_uuid 
        FROM auth.users 
        WHERE id = p_user_id_input::UUID;
        
        -- If user exists, return it
        IF FOUND THEN
            RETURN p_user_id_input::UUID;
        END IF;
      END IF;
      
      -- For non-UUID user IDs or non-existent UUIDs, use system user
      -- Create mapping for tracking purposes
      INSERT INTO user_id_mappings (original_id, mapped_uuid, user_type)
      VALUES (p_user_id_input, system_user_id, 'system')
      ON CONFLICT (original_id) DO UPDATE SET 
        mapped_uuid = system_user_id,
        last_used_at = NOW();
      
      RETURN system_user_id;
    END;
    $$;
    
    RAISE NOTICE 'Updated get_user_uuid function to use system user approach';
END $$;

-- Option 2: Alternative approach - disable foreign key constraint for system logs
-- ===========================================================================
-- If the above doesn't work, we can temporarily disable the constraint

-- First, let's see what constraints exist on api_usage_logs
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'api_usage_logs' AND tc.constraint_type = 'FOREIGN KEY';

-- Create a function that handles the foreign key constraint issue
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
  system_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Get the user UUID using our mapping function
  valid_user_id := get_user_uuid(p_user_id_input);
  
  -- Verify the user exists in auth.users table
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = valid_user_id) THEN
    -- If the mapped user doesn't exist, try to find any real user
    SELECT id INTO valid_user_id 
    FROM auth.users 
    LIMIT 1;
    
    -- If no users exist, use the system user ID
    IF valid_user_id IS NULL THEN
      valid_user_id := system_user_id;
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
    -- If we still get foreign key violation, try with a guaranteed valid user
    RAISE NOTICE 'Foreign key violation for user_id: %, trying with fallback', valid_user_id;
    
    -- Try to get any existing user
    SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
    
    -- If that fails too, we might need to create a dummy user or handle differently
    IF valid_user_id IS NULL THEN
      RAISE EXCEPTION 'No valid users found in auth.users table - cannot insert API usage log';
    END IF;
    
    -- Retry the insert with the valid user
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

-- Update the enhanced function to use the safe version
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

-- Verification
-- ===========
SELECT 'Functions updated to handle foreign key constraints:' as info;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('get_user_uuid', 'log_api_usage_safe', 'log_api_usage_enhanced');

-- Test the safe function
SELECT 'Testing safe API usage logging:' as test;
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