-- ============================================================================
-- CLEANED MIGRATION FILE: migration-2025-11-04-analytics.sql
-- Generated: 2025-11-06T08:29:02.035Z
-- Purpose: Safe migration execution without conflicts
-- 
-- Changes Made:
-- - Added IF NOT EXISTS to CREATE TABLE statements
-- - Added IF NOT EXISTS to CREATE INDEX statements  
-- - Added IF NOT EXISTS to CREATE POLICY statements
-- - Removed duplicate DROP POLICY statements
-- - Removed basic duplicate CREATE statements
-- 
-- This file should execute safely on existing databases.
-- ============================================================================

-- Advanced Analytics Database Schema - Enhancement 4
-- Comprehensive analytics infrastructure for admin and student dashboards

-- Main analytics events table for tracking all user activities
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'study_session', 'ai_interaction', 'question_answer', 
    'goal_completion', 'feature_usage', 'performance_update',
    'engagement', 'system_event', 'error_occurred'
  )),
  event_category TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  duration INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User goals tracking for goal analytics
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
    'study_time', 'questions_solved', 'accuracy_target', 
    'topic_mastery', 'streak_target', 'subject_progress'
  )),
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  target_unit VARCHAR(20) NOT NULL,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed', 'paused')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_context JSONB DEFAULT '{}'::jsonb,
  subject VARCHAR(100),
  topic VARCHAR(100),
  difficulty_level VARCHAR(20),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning velocity tracking
CREATE TABLE IF NOT EXISTS learning_velocity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  topics_mastered INTEGER DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  study_time_minutes INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  velocity_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Feature usage analytics
CREATE TABLE IF NOT EXISTS feature_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  engagement_score DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System-wide metrics for admin dashboard
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_category VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_date, metric_hour, metric_name)
);

-- A/B testing results storage
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(100) NOT NULL,
  variant_name VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  conversion_value DECIMAL(10,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- User goals indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_deadline ON user_goals(deadline);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_subject ON performance_metrics(subject);

-- Learning velocity indexes
CREATE INDEX IF NOT EXISTS idx_learning_velocity_user_id ON learning_velocity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_velocity_week ON learning_velocity(week_start_date);

-- Feature usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage_analytics(feature_name);

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);

-- A/B test results indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_name ON ab_test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_type_recorded ON performance_metrics(user_id, metric_type, recorded_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_velocity ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- User-based policies for personal data
CREATE POLICY IF NOT EXISTS "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own analytics events" ON analytics_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own learning velocity" ON learning_velocity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own learning velocity" ON learning_velocity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own feature usage" ON feature_usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own feature usage" ON feature_usage_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own A/B test results" ON ab_test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own A/B test results" ON ab_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies for system-wide access
CREATE POLICY IF NOT EXISTS "Admins can view all analytics events" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can view all system metrics" ON system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert system metrics" ON system_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Analytics views for aggregated insights
CREATE VIEW user_daily_analytics AS
SELECT 
  user_id,
  DATE(timestamp) as analytics_date,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'study_session' THEN 1 END) as study_sessions,
  COUNT(CASE WHEN event_type = 'ai_interaction' THEN 1 END) as ai_interactions,
  COUNT(CASE WHEN event_type = 'question_answer' THEN 1 END) as question_answers,
  COUNT(CASE WHEN event_type = 'feature_usage' THEN 1 END) as feature_usage,
  AVG(duration) as avg_session_duration,
  SUM(duration) as total_duration
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(timestamp);

CREATE VIEW weekly_user_progress AS
SELECT 
  user_id,
  DATE_TRUNC('week', timestamp) as week_start,
  COUNT(DISTINCT DATE(timestamp)) as active_days,
  SUM(duration) as total_study_minutes,
  COUNT(CASE WHEN event_type = 'question_answer' THEN 1 END) as questions_attempted,
  COUNT(CASE WHEN event_type = 'ai_interaction' THEN 1 END) as ai_features_used,
  AVG(engagement_score) as avg_engagement_score
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY user_id, DATE_TRUNC('week', timestamp);

CREATE VIEW feature_popularity_ranking AS
SELECT 
  feature_name,
  COUNT(DISTINCT user_id) as total_users,
  SUM(usage_count) as total_usage,
  AVG(engagement_score) as avg_engagement,
  MAX(last_used_at) as last_activity
FROM feature_usage_analytics
GROUP BY feature_name
ORDER BY total_usage DESC;

CREATE VIEW peak_usage_hours AS
SELECT 
  EXTRACT(hour FROM timestamp) as hour_of_day,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(timestamp) as usage_date
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(hour FROM timestamp), DATE(timestamp)
ORDER BY event_count DESC;

-- Analytics functions for common calculations
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(user_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_events INTEGER;
  active_days INTEGER;
  study_time INTEGER;
  engagement_score DECIMAL(5,2);
BEGIN
  -- Get basic metrics
  SELECT 
    COUNT(*),
    COUNT(DISTINCT DATE(timestamp)),
    COALESCE(SUM(duration), 0)
  INTO total_events, active_days, study_time
  FROM analytics_events
  WHERE user_id = user_uuid 
    AND timestamp >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  -- Calculate engagement score (0-100)
  engagement_score := LEAST(100, (
    (COALESCE(active_days, 0) * 10) +  -- Max 70 points for consistency
    (LEAST(total_events, 50) * 0.6) +  -- Max 30 points for activity
    (LEAST(study_time, 1800) * 0.02)   -- Max 36 points for study time
  ));
  
  RETURN ROUND(engagement_score, 2);
END;
$$;

CREATE OR REPLACE FUNCTION get_study_streak(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE;
  streak_date DATE;
BEGIN
  check_date := CURRENT_DATE;
  
  -- Count consecutive days with study activity
  WHILE TRUE LOOP
    SELECT DATE(timestamp) INTO streak_date
    FROM analytics_events
    WHERE user_id = user_uuid 
      AND event_type = 'study_session'
      AND DATE(timestamp) = check_date
    LIMIT 1;
    
    IF streak_date IS NULL THEN
      EXIT;
    END IF;
    
    current_streak := current_streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN current_streak;
END;
$$;

CREATE OR REPLACE FUNCTION track_feature_usage(
  user_uuid UUID,
  feature_name_param VARCHAR,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO feature_usage_analytics (
    user_id, 
    feature_name, 
    usage_count, 
    first_used_at, 
    last_used_at, 
    engagement_score,
    metadata
  ) VALUES (
    user_uuid,
    feature_name_param,
    1,
    NOW(),
    NOW(),
    1.0,
    metadata_param
  )
  ON CONFLICT (user_id, feature_name) 
  DO UPDATE SET 
    usage_count = feature_usage_analytics.usage_count + 1,
    last_used_at = NOW(),
    engagement_score = LEAST(10, feature_usage_analytics.engagement_score + 0.1),
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION get_top_performing_subjects(user_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  subject_name VARCHAR,
  accuracy_rate DECIMAL(5,2),
  questions_attempted INTEGER,
  time_spent_minutes INTEGER,
  improvement_trend DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.subject,
    ROUND(
      COUNT(CASE WHEN pm.metric_context->>'is_correct' = 'true' THEN 1 END) * 100.0 / 
      NULLIF(COUNT(*), 0), 2
    ) as accuracy_rate,
    COUNT(*) as questions_attempted,
    COALESCE(SUM(pm.metric_context->>'duration'::text)::INTEGER, 0) as time_spent_minutes,
    ROUND((RANDOM() * 20 - 10), 2) as improvement_trend -- Placeholder calculation
  FROM performance_metrics pm
  WHERE pm.user_id = user_uuid 
    AND pm.metric_type = 'question_attempt'
    AND pm.recorded_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY pm.subject
  ORDER BY accuracy_rate DESC
  LIMIT limit_count;
END;
$$;

-- Data cleanup function for analytics retention
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date DATE := CURRENT_DATE - (days_to_keep || ' days')::INTERVAL;
BEGIN
  -- Clean up old analytics events
  DELETE FROM analytics_events 
  WHERE created_at < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old system metrics
  DELETE FROM system_metrics 
  WHERE metric_date < cutoff_date;
  
  -- Clean up old A/B test results
  DELETE FROM ab_test_results 
  WHERE timestamp < cutoff_date;
  
  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON user_goals TO authenticated;
GRANT ALL ON performance_metrics TO authenticated;
GRANT ALL ON learning_velocity TO authenticated;
GRANT ALL ON feature_usage_analytics TO authenticated;
GRANT ALL ON system_metrics TO authenticated;
GRANT ALL ON ab_test_results TO authenticated;

GRANT SELECT ON user_daily_analytics TO authenticated;
GRANT SELECT ON weekly_user_progress TO authenticated;
GRANT SELECT ON feature_popularity_ranking TO authenticated;
GRANT SELECT ON peak_usage_hours TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_user_engagement_score(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_study_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_feature_usage(VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performing_subjects(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_analytics_data(INTEGER) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Main table for tracking all user activities and system events';
COMMENT ON TABLE user_goals IS 'User-defined goals and progress tracking';
COMMENT ON TABLE performance_metrics IS 'Individual performance data points for analytics';
COMMENT ON TABLE learning_velocity IS 'Weekly learning progress and velocity tracking';
COMMENT ON TABLE feature_usage_analytics IS 'Feature usage patterns and engagement metrics';
COMMENT ON TABLE system_metrics IS 'System-wide metrics for admin analytics';
COMMENT ON TABLE ab_test_results IS 'A/B testing results and conversion tracking';

COMMENT ON VIEW user_daily_analytics IS 'Daily aggregated analytics per user';
COMMENT ON VIEW weekly_user_progress IS 'Weekly progress summary per user';
COMMENT ON VIEW feature_popularity_ranking IS 'Feature usage ranking across all users';
COMMENT ON VIEW peak_usage_hours IS 'System usage patterns by hour';

COMMENT ON FUNCTION calculate_user_engagement_score(UUID, INTEGER) IS 'Calculate user engagement score based on activity';
COMMENT ON FUNCTION get_study_streak(UUID) IS 'Calculate consecutive study days streak';
COMMENT ON FUNCTION track_feature_usage(VARCHAR, JSONB) IS 'Track and update feature usage analytics';
COMMENT ON FUNCTION get_top_performing_subjects(UUID, INTEGER) IS 'Get top performing subjects for a user';
COMMENT ON FUNCTION cleanup_old_analytics_data(INTEGER) IS 'Clean up old analytics data for retention management';
