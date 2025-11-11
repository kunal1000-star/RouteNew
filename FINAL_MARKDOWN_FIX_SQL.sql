-- FINAL MARKDOWN RENDERING FIX - CORRECTED
-- ======================================
-- This is the final corrected version that handles the system_logs schema issue

-- Step 1: Check existing system_logs table schema
SELECT 
    'system_logs table schema check' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'action')
        THEN 'EXISTS_WITH_ACTION_COLUMN'
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs')
        THEN 'EXISTS_WITHOUT_ACTION_COLUMN'
        ELSE 'DOES_NOT_EXIST'
    END as status;

-- Step 2: Create or fix system_logs table schema
-- If table doesn't exist, create it with correct schema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Step 3: If table exists but has wrong schema, add missing columns
ALTER TABLE IF EXISTS system_logs 
ADD COLUMN IF NOT EXISTS action VARCHAR(100);

ALTER TABLE IF EXISTS system_logs 
ADD COLUMN IF NOT EXISTS details TEXT;

ALTER TABLE IF EXISTS system_logs 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS system_logs 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Step 4: Create performance indexes for Markdown rendering
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_content 
ON conversation_memory(user_id, created_at) 
WHERE interaction_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_memory_relevance 
ON conversation_memory(user_id, memory_relevance_score DESC, created_at DESC) 
WHERE memory_relevance_score IS NOT NULL;

-- Step 5: Create validation function (optional)
DROP FUNCTION IF EXISTS validate_markdown_content(TEXT);

CREATE OR REPLACE FUNCTION validate_markdown_content(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF content IS NULL OR length(content) = 0 THEN
        RETURN FALSE;
    END IF;
    
    IF length(content) > 1048576 THEN
        RETURN FALSE;
    END IF;
    
    IF content ILIKE '%<script%' OR content ILIKE '%javascript:%' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Add table documentation
COMMENT ON TABLE conversation_memory IS 'Stores conversation history and AI responses for Study Buddy chat with Markdown rendering support';

COMMENT ON SCHEMA public IS 'Markdown Rendering Fix: Enhanced Study Buddy chat with secure Markdown rendering, syntax highlighting, and math formula support';

-- Step 7: Log the successful application of the fix
INSERT INTO system_logs (
    id,
    action,
    details,
    timestamp,
    metadata
) VALUES (
    gen_random_uuid(),
    'MARKDOWN_RENDERING_FIX_APPLIED',
    'Study Buddy chat Markdown rendering fix has been successfully applied',
    NOW(),
    '{
        "version": "1.0",
        "components": ["MarkdownRenderer", "CodeBlock", "MathBlock", "Updated MessageBubble"],
        "security_features": ["XSS prevention", "Content sanitization", "Protocol validation"],
        "features": ["Syntax highlighting", "Math formulas", "GitHub Flavored Markdown"],
        "schema_fixed": true
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Step 8: Final verification
SELECT 
    'Final verification' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'action')
        THEN 'SUCCESS - system_logs table ready'
        ELSE 'FAILED - system_logs table still has issues'
    END as status;

-- Validation queries (run these to verify everything works)
/*
-- Check system_logs entry was created
SELECT action, details, timestamp FROM system_logs 
WHERE action = 'MARKDOWN_RENDERING_FIX_APPLIED' 
ORDER BY timestamp DESC LIMIT 1;

-- Test validation function
SELECT validate_markdown_content('# Test Markdown Content') as validation_test;

-- Check indexes were created
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename = 'conversation_memory' 
AND indexname LIKE '%user_content%' OR indexname LIKE '%relevance%';
*/