-- Database Connection Diagnostic Script
-- =====================================
-- This script helps diagnose database connection issues for the Markdown rendering fix

-- Test 1: Check if system_logs table exists
SELECT 
    'system_logs table exists' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs' AND table_schema = 'public') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 2: Check if conversation_memory table exists  
SELECT 
    'conversation_memory table exists' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_memory' AND table_schema = 'public') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 3: Check if student_ai_profile table exists
SELECT 
    'student_ai_profile table exists' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_ai_profile' AND table_schema = 'public') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 4: Check required columns in conversation_memory
SELECT 
    'conversation_memory columns check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversation_memory' 
            AND column_name IN ('interaction_data', 'memory_relevance_score', 'quality_score')
            GROUP BY table_name 
            HAVING COUNT(DISTINCT column_name) >= 3
        ) 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 5: Check Supabase extensions
SELECT 
    'uuid-ossp extension' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 6: Check if gen_random_uuid function exists
SELECT 
    'gen_random_uuid function' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'gen_random_uuid') 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Test 7: List all tables in public schema
SELECT 
    'Available tables in public schema' as test_name,
    string_agg(table_name, ', ') as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';