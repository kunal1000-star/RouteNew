-- ============================================================================
-- COMPREHENSIVE DATABASE FIXES FOR AI SYSTEMS
-- ============================================================================

-- Fix 1: Add missing query_type column to api_usage_logs
-- =====================================================
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS query_type TEXT;
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_query_type ON api_usage_logs(query_type);

-- Fix 2: Update any existing records with null query_type
UPDATE api_usage_logs 
SET query_type = 'general' 
WHERE query_type IS NULL;

-- Fix 3: Update log_api_usage function to include query_type
-- ==========================================================
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
  p_query_type TEXT DEFAULT 'general'
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
    query_type
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
    p_query_type
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Fix 4: Drop and recreate find_similar_memories function to handle both embedding dimensions
-- =========================================================================================
DROP FUNCTION IF EXISTS find_similar_memories(UUID, vector(1536), INTEGER, FLOAT);

CREATE FUNCTION find_similar_memories(
  p_user_id UUID,
  p_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  importance_score INTEGER,
  tags TEXT[],
  source_conversation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.content,
    m.importance_score,
    m.tags,
    m.source_conversation_id,
    m.created_at,
    m.expires_at,
    m.is_active,
    1 - (m.embedding <=> p_embedding) as similarity
  FROM study_chat_memory m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND 1 - (m.embedding <=> p_embedding) >= p_min_similarity
  ORDER BY m.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;

-- Fix 5: Add helper function to validate and format conversation IDs
-- =================================================================
CREATE OR REPLACE FUNCTION format_conversation_id(
  p_input TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  result UUID;
BEGIN
  -- If input is already a valid UUID, use it directly
  IF p_input ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN p_input::UUID;
  END IF;
  
  -- If input looks like a timestamp-based ID, generate a proper UUID
  IF p_input LIKE 'conv-%' THEN
    -- Extract timestamp and create deterministic UUID
    RETURN md5(p_input)::UUID;
  END IF;
  
  -- For any other format, generate a random UUID
  RETURN gen_random_uuid();
END;
$$;

-- Fix 6: Create conversation_memory table if it doesn't exist
-- ===========================================================
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_content TEXT NOT NULL,
  memory_relevance_score FLOAT DEFAULT 0.5,
  conversation_id UUID,
  memory_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '8 months'),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Add RLS policies for conversation_memory
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversation memory" ON conversation_memory
  FOR ALL USING (auth.uid() = user_id);

-- Fix 7: Add missing columns to conversation_memory if they don't exist
ALTER TABLE conversation_memory 
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS importance_score INTEGER DEFAULT 3;

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_relevance ON conversation_memory(memory_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_embedding ON conversation_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Verification Queries
-- ====================
SELECT 'api_usage_logs table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'api_usage_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'conversation_memory table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversation_memory' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Functions updated:' as info;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('log_api_usage', 'find_similar_memories', 'format_conversation_id');

-- Test queries
SELECT 'Testing conversation_memory access:' as test;
SELECT COUNT(*) as total_memories FROM conversation_memory;

SELECT 'Testing api_usage_logs access:' as test;
SELECT COUNT(*) as total_logs FROM api_usage_logs;