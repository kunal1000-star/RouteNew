-- ===================================================================
-- RATE LIMIT FIX: Database Migration for Default Rate Limits
-- ===================================================================
-- This migration sets reasonable default rate limits for all users and providers
-- to resolve the "high demand" error that was occurring due to overly restrictive
-- rate limits (60 requests per minute).

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rate limits for all providers
-- These values are more generous than the previous 60/minute default
INSERT INTO user_provider_limits (user_id, provider, max_requests_per_min, updated_at)
SELECT 
    users.id as user_id,
    provider_list.provider,
    provider_list.default_limit,
    NOW() as updated_at
FROM 
    (SELECT 'groq' as provider, 150 as default_limit
     UNION ALL SELECT 'gemini', 120
     UNION ALL SELECT 'cerebras', 180
     UNION ALL SELECT 'cohere', 100
     UNION ALL SELECT 'mistral', 80
     UNION ALL SELECT 'openrouter', 200) as provider_list
CROSS JOIN 
    auth.users as users
WHERE 
    -- Only insert for users who don't already have limits set
    NOT EXISTS (
        SELECT 1 FROM user_provider_limits upl 
        WHERE upl.user_id = users.id 
        AND upl.provider = provider_list.provider
    );

-- Create index for better performance on rate limit queries
CREATE INDEX IF NOT EXISTS idx_user_provider_limits_user_provider 
ON user_provider_limits(user_id, provider);

-- Create index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_user_provider_limits_provider 
ON user_provider_limits(provider);

-- Update any existing limits that are too restrictive (< 100/minute)
UPDATE user_provider_limits 
SET max_requests_per_min = GREATEST(max_requests_per_min, 100)
WHERE max_requests_per_min < 100;

-- Log the changes (now that system_logs table exists)
INSERT INTO system_logs (event_type, event_data, created_at)
VALUES (
    'RATE_LIMIT_FIX', 
    json_build_object(
        'message', 'Updated default rate limits for all users',
        'provider_limits', 'groq:150, gemini:120, cerebras:180, cohere:100, mistral:80, openrouter:200',
        'affected_users', (SELECT COUNT(DISTINCT user_id) FROM user_provider_limits)
    ),
    NOW()
);

-- Show summary of changes
SELECT 
    provider,
    COUNT(*) as user_count,
    AVG(max_requests_per_min) as avg_limit,
    MIN(max_requests_per_min) as min_limit,
    MAX(max_requests_per_min) as max_limit
FROM user_provider_limits
GROUP BY provider
ORDER BY provider;
