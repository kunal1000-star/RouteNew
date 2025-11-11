-- System Logs Schema Check
-- ========================
-- This script checks the actual schema of the system_logs table

-- Check if system_logs table exists and what columns it has
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'system_logs' 
ORDER BY ordinal_position;

-- If system_logs table doesn't exist, create it with proper schema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Now test the original query that was failing
INSERT INTO system_logs (
    id,
    action,
    details,
    timestamp,
    metadata
) VALUES (
    gen_random_uuid(),
    'MARKDOWN_RENDERING_FIX_TEST',
    'Testing system_logs table after schema fix',
    NOW(),
    '{"test": true, "schema_verified": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- Verify the insert worked
SELECT action, details, timestamp FROM system_logs 
WHERE action = 'MARKDOWN_RENDERING_FIX_TEST' 
ORDER BY timestamp DESC 
LIMIT 1;