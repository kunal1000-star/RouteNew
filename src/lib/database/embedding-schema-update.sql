-- File Embedding System Database Schema Update
-- ===============================================
-- This script adds vector embedding columns to support semantic file search

-- Add vector embedding columns to file_analyses table
-- Note: Requires pgvector extension to be installed in PostgreSQL

-- Create vector extension if not exists (run once)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns for different aspects of file content
ALTER TABLE file_analyses 
ADD COLUMN IF NOT EXISTS content_embedding vector(1536),
ADD COLUMN IF NOT EXISTS summary_embedding vector(1536),
ADD COLUMN IF NOT EXISTS topics_embedding vector(1536);

-- Add updated_at column for tracking embedding updates
ALTER TABLE file_analyses 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create vector similarity indexes for fast searching
-- Note: These indexes are crucial for performance with large datasets

-- Index for content-based similarity search
CREATE INDEX IF NOT EXISTS file_analyses_content_embedding_idx 
ON file_analyses 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for summary-based similarity search  
CREATE INDEX IF NOT EXISTS file_analyses_summary_embedding_idx
ON file_analyses 
USING ivfflat (summary_embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for topics-based similarity search
CREATE INDEX IF NOT EXISTS file_analyses_topics_embedding_idx
ON file_analyses 
USING ivfflat (topics_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on updated_at for efficient updates
CREATE INDEX IF NOT EXISTS file_analyses_updated_at_idx
ON file_analyses (updated_at DESC);

-- Function to calculate cosine similarity between embeddings
CREATE OR REPLACE FUNCTION calculate_embedding_similarity(
    embedding1 vector,
    embedding2 vector
) RETURNS float AS $$
BEGIN
    -- Calculate cosine similarity: (A · B) / (|A| * |B|)
    RETURN (embedding1 <#> embedding2) * -1; -- pgvector returns negative cosine distance
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar files using embeddings
CREATE OR REPLACE FUNCTION find_similar_files(
    query_embedding vector,
    user_id_param text,
    similarity_threshold float DEFAULT 0.6,
    result_limit int DEFAULT 10,
    embedding_type text DEFAULT 'content'
) RETURNS TABLE (
    id uuid,
    file_id text,
    file_name text,
    file_type text,
    subject text,
    summary text,
    similarity float,
    analysis_date timestamptz
) AS $$
BEGIN
    -- Choose the appropriate embedding column
    CASE embedding_type
        WHEN 'content' THEN
            RETURN QUERY
            SELECT 
                fa.id,
                fa.file_id,
                fa.file_name,
                fa.file_type,
                fa.subject,
                fa.summary,
                (1 - (fa.content_embedding <=> query_embedding)) as similarity, -- Convert distance to similarity
                fa.analysis_date
            FROM file_analyses fa
            WHERE fa.user_id = user_id_param 
              AND fa.content_embedding IS NOT NULL
              AND fa.is_active = true
              AND (1 - (fa.content_embedding <=> query_embedding)) >= similarity_threshold
            ORDER BY fa.content_embedding <=> query_embedding
            LIMIT result_limit;
            
        WHEN 'summary' THEN
            RETURN QUERY
            SELECT 
                fa.id,
                fa.file_id,
                fa.file_name,
                fa.file_type,
                fa.subject,
                fa.summary,
                (1 - (fa.summary_embedding <=> query_embedding)) as similarity,
                fa.analysis_date
            FROM file_analyses fa
            WHERE fa.user_id = user_id_param 
              AND fa.summary_embedding IS NOT NULL
              AND fa.is_active = true
              AND (1 - (fa.summary_embedding <=> query_embedding)) >= similarity_threshold
            ORDER BY fa.summary_embedding <=> query_embedding
            LIMIT result_limit;
            
        WHEN 'topics' THEN
            RETURN QUERY
            SELECT 
                fa.id,
                fa.file_id,
                fa.file_name,
                fa.file_type,
                fa.subject,
                fa.summary,
                (1 - (fa.topics_embedding <=> query_embedding)) as similarity,
                fa.analysis_date
            FROM file_analyses fa
            WHERE fa.user_id = user_id_param 
              AND fa.topics_embedding IS NOT NULL
              AND fa.is_active = true
              AND (1 - (fa.topics_embedding <=> query_embedding)) >= similarity_threshold
            ORDER BY fa.topics_embedding <=> query_embedding
            LIMIT result_limit;
            
        ELSE
            RAISE EXCEPTION 'Invalid embedding type: %. Use content, summary, or topics', embedding_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update file embeddings
CREATE OR REPLACE FUNCTION update_file_embeddings(
    file_id_param text,
    user_id_param text,
    content_embedding_param vector,
    summary_embedding_param vector DEFAULT NULL,
    topics_embedding_param vector DEFAULT NULL
) RETURNS void AS $$
BEGIN
    UPDATE file_analyses 
    SET 
        content_embedding = content_embedding_param,
        summary_embedding = summary_embedding_param,
        topics_embedding = topics_embedding_param,
        updated_at = now()
    WHERE file_id = file_id_param 
      AND user_id = user_id_param;
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'File not found: % for user: %', file_id_param, user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get files that need embedding updates
CREATE OR REPLACE FUNCTION get_files_needing_embeddings(
    user_id_param text,
    older_than_hours int DEFAULT 24
) RETURNS TABLE (
    id uuid,
    file_id text,
    file_name text,
    subject text,
    created_at timestamptz,
    content_embedding vector,
    summary_embedding vector,
    topics_embedding vector
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.id,
        fa.file_id,
        fa.file_name,
        fa.subject,
        fa.created_at,
        fa.content_embedding,
        fa.summary_embedding,
        fa.topics_embedding
    FROM file_analyses fa
    WHERE fa.user_id = user_id_param
      AND fa.is_active = true
      AND (
          fa.content_embedding IS NULL 
          OR fa.summary_embedding IS NULL 
          OR fa.topics_embedding IS NULL
          OR fa.updated_at < (now() - (older_than_hours || ' hours')::interval)
      )
    ORDER BY fa.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for embedding statistics
CREATE OR REPLACE VIEW file_embedding_stats AS
SELECT 
    user_id,
    COUNT(*) as total_files,
    COUNT(content_embedding) as files_with_content_embedding,
    COUNT(summary_embedding) as files_with_summary_embedding,
    COUNT(topics_embedding) as files_with_topics_embedding,
    COUNT(*) FILTER (WHERE content_embedding IS NOT NULL 
                     AND summary_embedding IS NOT NULL 
                     AND topics_embedding IS NOT NULL) as files_with_all_embeddings,
    ROUND(COUNT(*) FILTER (WHERE content_embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 2) as content_embedding_coverage,
    ROUND(COUNT(*) FILTER (WHERE summary_embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 2) as summary_embedding_coverage,
    ROUND(COUNT(*) FILTER (WHERE topics_embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 2) as topics_embedding_coverage
FROM file_analyses
WHERE is_active = true
GROUP BY user_id;

-- Grant necessary permissions (adjust based on your setup)
-- Note: In production, you might want to restrict these to specific roles
GRANT EXECUTE ON FUNCTION find_similar_files(vector, text, float, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_file_embeddings(text, text, vector, vector, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION get_files_needing_embeddings(text, int) TO authenticated;
GRANT SELECT ON file_embedding_stats TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN file_analyses.content_embedding IS 'Vector embedding of the full file content (1536 dimensions)';
COMMENT ON COLUMN file_analyses.summary_embedding IS 'Vector embedding of the file summary (1536 dimensions)';
COMMENT ON COLUMN file_analyses.topics_embedding IS 'Vector embedding of file topics (1536 dimensions)';
COMMENT ON COLUMN file_analyses.updated_at IS 'Timestamp when embeddings were last updated';

COMMENT ON FUNCTION find_similar_files(vector, text, float, int, text) IS 'Find files similar to query embedding using cosine similarity';
COMMENT ON FUNCTION update_file_embeddings(text, text, vector, vector, vector) IS 'Update embeddings for a specific file';
COMMENT ON FUNCTION get_files_needing_embeddings(text, int) IS 'Get files that need embedding generation or updates';