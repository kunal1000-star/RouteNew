-- Markdown Rendering Fix - Fixed Database Script
-- ==============================================
-- 
-- This is a fixed version of the markdown rendering fix that addresses
-- database connection issues and missing table dependencies.
--
-- IMPORTANT: This script should be run with proper database connection:
-- psql -d "your_database_url" -f markdown-rendering-fix-fixed.sql
--
-- Or run the individual sections that are needed for your setup.

-- ========================================
-- SECTION 1: OPTIONAL SYSTEM LOGS TABLE
-- ========================================
-- Only run this if you don't have a system_logs table

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ========================================
-- SECTION 2: PERFORMANCE INDEXES
-- ========================================
-- These indexes improve performance for Markdown rendering features

-- Create index on conversation_memory for faster user queries
-- This helps with memory context building during Markdown rendering
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_content 
ON conversation_memory(user_id, created_at) 
WHERE interaction_data IS NOT NULL;

-- Create index for faster memory relevance scoring
-- This improves search performance for related content
CREATE INDEX IF NOT EXISTS idx_conversation_memory_relevance 
ON conversation_memory(user_id, memory_relevance_score DESC, created_at DESC) 
WHERE memory_relevance_score IS NOT NULL;

-- ========================================
-- SECTION 3: UTILITY FUNCTIONS
-- ========================================
-- Optional utility function for Markdown content validation

-- Drop function if it exists (safe to run)
DROP FUNCTION IF EXISTS validate_markdown_content(TEXT);

-- Create function to validate Markdown content (optional enhancement)
CREATE OR REPLACE FUNCTION validate_markdown_content(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic validation: check if content is not null and has reasonable length
    IF content IS NULL OR length(content) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for maximum reasonable length (1MB)
    IF length(content) > 1048576 THEN
        RETURN FALSE;
    END IF;
    
    -- Basic XSS prevention check (simplified)
    IF content ILIKE '%<script%' OR content ILIKE '%javascript:%' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- SECTION 4: SCHEMA DOCUMENTATION
-- ========================================
-- Add comments to document the purpose of tables

-- Add comment to conversation_memory table
COMMENT ON TABLE conversation_memory IS 'Stores conversation history and AI responses for Study Buddy chat with Markdown rendering support';

-- Add comment describing the Markdown rendering enhancement
COMMENT ON SCHEMA public IS 'Markdown Rendering Fix: Enhanced Study Buddy chat with secure Markdown rendering, syntax highlighting, and math formula support';

-- ========================================
-- SECTION 5: PERMISSION VERIFICATION
-- ========================================
-- Check if necessary permissions exist (informational only)

-- This section shows what permissions are needed but doesn't modify them
-- You should run these checks to verify your database setup:

-- Check SELECT permissions
-- SELECT has_table_privilege('authenticated', 'conversation_memory', 'SELECT');

-- Check INSERT permissions  
-- SELECT has_table_privilege('authenticated', 'conversation_memory', 'INSERT');

-- Check UPDATE permissions
-- SELECT has_table_privilege('authenticated', 'conversation_memory', 'UPDATE');

-- ========================================
-- SECTION 6: LOG THE FIX APPLICATION
-- ========================================
-- Log that the Markdown rendering fix has been applied

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
        "features": ["Syntax highlighting", "Math formulas", "GitHub Flavored Markdown"]
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- ========================================
-- SECTION 7: VALIDATION QUERIES
-- ========================================
-- These queries help verify the fix was applied correctly
-- Run these after the script completes

-- 1. Check if required tables exist
-- SELECT table_name, table_schema 
-- FROM information_schema.tables 
-- WHERE table_name IN ('conversation_memory', 'student_ai_profile', 'system_logs') 
-- AND table_schema = 'public';

-- 2. Check for performance indexes
-- SELECT indexname, tablename, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('conversation_memory') 
-- AND indexname LIKE '%markdown%' OR indexname LIKE '%chat%' OR indexname LIKE '%user_content%' OR indexname LIKE '%relevance%';

-- 3. Test the validation function
-- SELECT validate_markdown_content('# Test Markdown Content') as valid_markdown;

-- 4. Check recent system logs for fix application
-- SELECT action, details, timestamp 
-- FROM system_logs 
-- WHERE action = 'MARKDOWN_RENDERING_FIX_APPLIED' 
-- ORDER BY timestamp DESC 
-- LIMIT 5;

-- ========================================
-- INSTALLATION INSTRUCTIONS
-- ========================================
/*
To apply this fix:

1. Ensure you have proper database connection:
   export DATABASE_URL="postgresql://username:password@host:port/database"

2. Run the script:
   psql -d "$DATABASE_URL" -f markdown-rendering-fix-fixed.sql

3. OR run individual sections in your database client:
   - Copy the sections you need
   - Execute them in your Supabase SQL editor or PostgreSQL client

4. Verify the fix:
   - Run the validation queries (uncomment them)
   - Check that indexes were created
   - Verify the system_logs entry was added

5. Test the Markdown rendering:
   - Visit /study-buddy-test page
   - Verify that Markdown content renders properly
   - Test code blocks, math formulas, and tables

*/

-- ========================================
-- TROUBLESHOOTING
-- ========================================
/*
If you get connection errors:

1. Make sure DATABASE_URL is set:
   echo $DATABASE_URL
   
2. For Supabase, use the connection string from:
   Supabase Dashboard > Settings > Database > Connection string

3. Test connection:
   psql $DATABASE_URL

4. If tables don't exist, you may need to run migrations first:
   npm run db:migrate

5. For browser-based SQL execution, use:
   Supabase Dashboard > SQL Editor > New query
*/

-- ========================================
-- END OF SCRIPT
-- ========================================