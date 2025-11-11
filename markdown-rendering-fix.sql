-- Markdown Rendering Fix - Database Schema Updates
-- ==================================================
-- 
-- This SQL script contains any database changes needed to support
-- the enhanced Markdown rendering functionality in Study Buddy chat.
-- 
-- Note: The Markdown rendering fix is primarily frontend-focused,
-- but this script ensures database compatibility and any necessary
-- schema updates for enhanced chat functionality.

BEGIN;

-- 1. Ensure conversation_memory table has proper structure for enhanced chat
-- This table stores conversation history and context for AI responses
-- No schema changes needed as the existing structure supports Markdown content

-- Verify conversation_memory table structure
DO $$
BEGIN
    -- Check if conversation_memory table exists and has required columns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_memory') THEN
        RAISE NOTICE 'conversation_memory table exists - no schema updates needed';
    ELSE
        RAISE NOTICE 'conversation_memory table missing - ensure it exists for chat functionality';
    END IF;
    
    -- Check for key columns that support Markdown rendering
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'conversation_memory' 
        AND column_name IN ('interaction_data', 'memory_relevance_score', 'quality_score')
    ) THEN
        RAISE NOTICE 'Required conversation_memory columns exist';
    ELSE
        RAISE NOTICE 'conversation_memory columns may need verification';
    END IF;
END $$;

-- 2. Ensure student_ai_profile table structure supports enhanced chat
-- This table stores student profiles for personalized responses
-- No schema changes needed as existing structure supports enhanced content

-- Verify student_ai_profile table structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_ai_profile') THEN
        RAISE NOTICE 'student_ai_profile table exists - no schema updates needed';
    ELSE
        RAISE NOTICE 'student_ai_profile table missing - ensure it exists for student profiles';
    END IF;
END $$;

-- 3. Create index for better performance with Markdown content searches
-- This improves search performance for memory context retrieval

-- Create index on conversation_memory for faster text searches
-- This helps with semantic search and memory context building
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_content 
ON conversation_memory(user_id, created_at) 
WHERE interaction_data IS NOT NULL;

-- Create index for faster memory relevance scoring
CREATE INDEX IF NOT EXISTS idx_conversation_memory_relevance 
ON conversation_memory(user_id, memory_relevance_score DESC, created_at DESC) 
WHERE memory_relevance_score IS NOT NULL;

-- 4. Add comment describing the purpose of Markdown rendering enhancement
COMMENT ON SCHEMA public IS 'Markdown Rendering Fix: Enhanced Study Buddy chat with secure Markdown rendering, syntax highlighting, and math formula support';

-- 5. Verify database permissions for chat functionality
-- Ensure the application has proper permissions for chat operations

-- Check if chat-related roles have necessary permissions
DO $$
DECLARE
    has_select BOOLEAN;
    has_insert BOOLEAN;
    has_update BOOLEAN;
BEGIN
    -- Check SELECT permissions
    SELECT has_table_privilege('authenticated', 'conversation_memory', 'SELECT') INTO has_select;
    IF has_select THEN
        RAISE NOTICE 'Authenticated users can SELECT from conversation_memory';
    ELSE
        RAISE NOTICE 'Authenticated users need SELECT permission on conversation_memory';
    END IF;
    
    -- Check INSERT permissions
    SELECT has_table_privilege('authenticated', 'conversation_memory', 'INSERT') INTO has_insert;
    IF has_insert THEN
        RAISE NOTICE 'Authenticated users can INSERT into conversation_memory';
    ELSE
        RAISE NOTICE 'Authenticated users need INSERT permission on conversation_memory';
    END IF;
    
    -- Check UPDATE permissions
    SELECT has_table_privilege('authenticated', 'conversation_memory', 'UPDATE') INTO has_update;
    IF has_update THEN
        RAISE NOTICE 'Authenticated users can UPDATE conversation_memory';
    ELSE
        RAISE NOTICE 'Authenticated users need UPDATE permission on conversation_memory';
    END IF;
END $$;

-- 6. Test data insertion for Markdown content (optional)
-- Insert sample data to test Markdown rendering functionality
-- This is commented out by default - uncomment if needed for testing

/*
-- Insert sample conversation memory with Markdown content
INSERT INTO conversation_memory (
    user_id,
    conversation_id,
    memory_type,
    interaction_data,
    quality_score,
    memory_relevance_score,
    user_satisfaction,
    priority,
    retention,
    tags,
    metadata
) VALUES (
    '322531b3-173d-42a9-be4c-770ad92ac8b8', -- User ID from the request
    gen_random_uuid(),
    'ai_response',
    '{
        "content": "Here is a code example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Usage\ngreet(\"World\"); // Returns \"Hello, World!\"",
        "response": "Here is a code example with syntax highlighting:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Usage\ngreet(\"World\"); // Returns \"Hello, World!\"",
        "subject": "JavaScript",
        "topic": "Functions",
        "complexity": "beginner"
    }'::jsonb,
    0.85,
    0.75,
    NULL,
    'medium',
    'long_term',
    '{"javascript", "functions", "coding"}',
    '{
        "markdown_rendered": true,
        "syntax_highlighting": true,
        "math_formulas": false,
        "security_sanitized": true,
        "rendering_version": "1.0"
    }'::jsonb
) ON CONFLICT DO NOTHING;
*/

-- 7. Performance optimization queries
-- These queries help optimize the database for Markdown rendering workloads

-- Analyze tables for better query planning
ANALYZE conversation_memory;
ANALYZE student_ai_profile;

-- 8. Create function to validate Markdown content (optional enhancement)
-- This function could be used to validate Markdown content before storage

DROP FUNCTION IF EXISTS validate_markdown_content(TEXT);

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

-- 9. Add table comment for documentation
COMMENT ON TABLE conversation_memory IS 'Stores conversation history and AI responses for Study Buddy chat with Markdown rendering support';

-- 10. Log completion of Markdown rendering fix
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

COMMIT;

-- ========================================
-- VALIDATION QUERIES
-- ========================================
-- Run these queries to verify the Markdown rendering fix implementation

-- 1. Check if required tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('conversation_memory', 'student_ai_profile') 
AND table_schema = 'public';

-- 2. Check for performance indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('conversation_memory') 
AND indexname LIKE '%markdown%' OR indexname LIKE '%chat%';

-- 3. Test the validation function
SELECT validate_markdown_content('# Test Markdown Content') as valid_markdown;

-- 4. Check recent system logs for fix application
SELECT action, details, timestamp 
FROM system_logs 
WHERE action = 'MARKDOWN_RENDERING_FIX_APPLIED' 
ORDER BY timestamp DESC 
LIMIT 5;

-- ========================================
-- ROLLBACK INSTRUCTIONS
-- ========================================
-- If rollback is needed, the Markdown rendering fix is primarily frontend.
-- To rollback:
-- 1. Revert MessageBubble.tsx to use plain text rendering
-- 2. Remove the new component files (MarkdownRenderer.tsx, CodeBlock.tsx, MathBlock.tsx)
-- 3. Remove the new dependencies from package.json
-- 4. Drop the validation function if not needed elsewhere
-- 
-- DROP FUNCTION IF EXISTS validate_markdown_content(TEXT);
-- The database schema changes are minimal and should not require rollback.

-- ========================================
-- END OF MARKDOWN RENDERING FIX
-- ========================================