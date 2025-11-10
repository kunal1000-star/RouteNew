-- Create search_cache table for web search caching
-- This table stores web search results to improve performance and reduce API calls

CREATE TABLE IF NOT EXISTS search_cache (
  id TEXT PRIMARY KEY,
  query_hash TEXT NOT NULL UNIQUE,
  search_type TEXT NOT NULL,
  results JSONB NOT NULL,
  total_results INTEGER NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_search_cache_query_hash ON search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires_at ON search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_last_accessed ON search_cache(last_accessed);
CREATE INDEX IF NOT EXISTS idx_search_cache_type ON search_cache(search_type);

-- Create RLS policies
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (bypasses RLS)
CREATE POLICY "Service role can manage search cache" ON search_cache
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_search_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM search_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_search_cache_stats()
RETURNS TABLE (
  total_entries BIGINT,
  expired_entries BIGINT,
  active_entries BIGINT,
  total_hits BIGINT,
  avg_hits_per_entry NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries,
    COUNT(*) FILTER (WHERE expires_at >= NOW()) as active_entries,
    SUM(hit_count) as total_hits,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND(AVG(hit_count), 2)
      ELSE 0
    END as avg_hits_per_entry
  FROM search_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some example data for testing (optional)
-- This will be removed in production