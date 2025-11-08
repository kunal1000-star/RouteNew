# Database Schema Enhancements for Hallucination Prevention
========================================================

## Overview

This document outlines the database schema changes required to support the 5-layer hallucination prevention system. The enhancements focus on storing validation data, feedback, monitoring metrics, and quality assurance information.

## Core Tables

### 1. Input Validation Storage
```sql
-- Input validation logs
CREATE TABLE input_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id TEXT,
  original_input TEXT NOT NULL,
  filtered_input TEXT,
  validation_result JSONB NOT NULL,
  filter_actions TEXT[] DEFAULT '{}',
  sanitization_steps TEXT[] DEFAULT '{}',
  query_classification JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query classification cache
CREATE TABLE query_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_hash TEXT UNIQUE NOT NULL,
  classification JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  required_context_level INTEGER,
  response_strategy JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Context & Memory Management
```sql
-- Enhanced knowledge base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id),
  content TEXT NOT NULL,
  content_hash TEXT UNIQUE NOT NULL,
  topics TEXT[] DEFAULT '{}',
  fact_type VARCHAR(50) DEFAULT 'fact',
  confidence_score DECIMAL(3,2),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge sources
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  url TEXT,
  author TEXT,
  publication_date DATE,
  reliability_score DECIMAL(3,2),
  verification_status VARCHAR(20) DEFAULT 'pending',
  citation_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation memory enhanced
CREATE TABLE conversation_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID,
  interaction_data JSONB NOT NULL,
  quality_score DECIMAL(3,2),
  user_satisfaction DECIMAL(3,2),
  feedback_collected BOOLEAN DEFAULT FALSE,
  memory_relevance_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context optimization logs
CREATE TABLE context_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query_hash TEXT,
  original_context JSONB,
  optimized_context JSONB,
  size_reduction DECIMAL(5,2),
  relevance_score DECIMAL(3,2),
  optimization_strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Response Validation & Fact-Checking
```sql
-- Response validation results
CREATE TABLE response_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID,
  ai_response_id UUID NOT NULL,
  validation_result JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  issues_found JSONB,
  recommendations TEXT[] DEFAULT '{}',
  validation_level VARCHAR(20) DEFAULT 'basic',
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI responses with quality metrics
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID,
  original_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used VARCHAR(100),
  provider_used VARCHAR(50),
  response_metadata JSONB,
  quality_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  fact_check_status VARCHAR(20) DEFAULT 'pending',
  contradiction_detected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fact checking results
CREATE TABLE fact_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES ai_responses(id),
  fact_text TEXT NOT NULL,
  verification_result JSONB NOT NULL,
  sources_used UUID[] DEFAULT '{}',
  confidence_level DECIMAL(3,2),
  verification_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contradictions and inconsistencies
CREATE TABLE response_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES ai_responses(id),
  contradiction_type VARCHAR(50) NOT NULL,
  conflicting_claims JSONB,
  contradiction_score DECIMAL(3,2),
  resolution_status VARCHAR(20) DEFAULT 'detected',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. User Feedback & Learning
```sql
-- User feedback collection
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  interaction_id UUID,
  response_id UUID REFERENCES ai_responses(id),
  feedback_type VARCHAR(50) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  corrections JSONB,
  flag_reasons TEXT[] DEFAULT '{}',
  satisfaction_score DECIMAL(3,2),
  feedback_text TEXT,
  implicit_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning patterns and corrections
CREATE TABLE learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pattern_type VARCHAR(50) NOT NULL,
  pattern_data JSONB NOT NULL,
  frequency INTEGER DEFAULT 1,
  confidence_level DECIMAL(3,2),
  last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  learning_style VARCHAR(50),
  preferred_complexity VARCHAR(20),
  response_preferences JSONB,
  quality_tolerance DECIMAL(3,2),
  subject_areas TEXT[] DEFAULT '{}',
  profile_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback pattern analysis
CREATE TABLE feedback_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  analysis_period TIMESTAMP WITH TIME ZONE,
  pattern_summary JSONB NOT NULL,
  improvement_areas TEXT[] DEFAULT '{}',
  success_factors TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',
  analysis_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Quality Assurance & Monitoring
```sql
-- Real-time monitoring metrics
CREATE TABLE quality_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  interaction_id UUID,
  quality_score DECIMAL(3,2),
  hallucination_probability DECIMAL(3,2),
  anomaly_indicators JSONB,
  alerts_triggered JSONB,
  monitoring_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics
CREATE TABLE performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10,4),
  metric_metadata JSONB,
  time_period TIMESTAMP WITH TIME ZONE,
  user_segment VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hallucination detection events
CREATE TABLE hallucination_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  response_id UUID REFERENCES ai_responses(id),
  detection_method VARCHAR(50),
  confidence_score DECIMAL(3,2),
  indicators JSONB,
  severity_level VARCHAR(20),
  resolution_status VARCHAR(20) DEFAULT 'detected',
  human_review_required BOOLEAN DEFAULT FALSE,
  false_positive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  alert_data JSONB,
  resolution_status VARCHAR(20) DEFAULT 'active',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes for Performance

```sql
-- Input validation indexes
CREATE INDEX idx_input_validation_user_id ON input_validation_logs(user_id);
CREATE INDEX idx_input_validation_session ON input_validation_logs(session_id);
CREATE INDEX idx_input_validation_created ON input_validation_logs(created_at);
CREATE INDEX idx_query_classifications_hash ON query_classifications(input_hash);

-- Context management indexes
CREATE INDEX idx_knowledge_content_hash ON knowledge_base(content_hash);
CREATE INDEX idx_knowledge_source_type ON knowledge_sources(source_type);
CREATE INDEX idx_knowledge_verification ON knowledge_base(verification_status);
CREATE INDEX idx_conversation_memories_user ON conversation_memories(user_id);
CREATE INDEX idx_conversation_memories_conversation ON conversation_memories(conversation_id);

-- Response validation indexes
CREATE INDEX idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX idx_ai_responses_conversation ON ai_responses(conversation_id);
CREATE INDEX idx_ai_responses_created ON ai_responses(created_at);
CREATE INDEX idx_response_validations_response ON response_validations(ai_response_id);
CREATE INDEX idx_fact_checks_response ON fact_checks(response_id);
CREATE INDEX idx_contradictions_response ON response_contradictions(response_id);

-- Feedback and learning indexes
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_interaction ON user_feedback(interaction_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_learning_patterns_user ON learning_patterns(user_id);
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- Monitoring and quality indexes
CREATE INDEX idx_quality_monitoring_user ON quality_monitoring(user_id);
CREATE INDEX idx_quality_monitoring_created ON quality_monitoring(created_at);
CREATE INDEX idx_performance_analytics_type ON performance_analytics(metric_type);
CREATE INDEX idx_hallucination_events_user ON hallucination_events(user_id);
CREATE INDEX idx_hallucination_events_severity ON hallucination_events(severity_level);
CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
```

## Database Functions

```sql
-- Function to calculate quality score from multiple factors
CREATE OR REPLACE FUNCTION calculate_quality_score(
  confidence_score DECIMAL,
  fact_check_score DECIMAL,
  user_satisfaction DECIMAL,
  validation_score DECIMAL
) RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN (
    confidence_score * 0.3 +
    fact_check_score * 0.3 +
    user_satisfaction * 0.2 +
    validation_score * 0.2
  );
END;
$$ LANGUAGE plpgsql;

-- Function to detect high-risk interactions
CREATE OR REPLACE FUNCTION detect_high_risk_interaction(
  quality_data JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check for multiple risk indicators
  RETURN (
    (quality_data->>'hallucination_probability')::DECIMAL > 0.7 OR
    (quality_data->>'confidence_score')::DECIMAL < 0.3 OR
    (quality_data->>'user_satisfaction')::DECIMAL < 2.0 OR
    (quality_data->>'contradiction_detected')::BOOLEAN = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update user profile based on feedback
CREATE OR REPLACE FUNCTION update_user_profile_from_feedback(
  p_user_id UUID,
  p_feedback_data JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (user_id, profile_data)
  VALUES (p_user_id, p_feedback_data)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    profile_data = user_profiles.profile_data || p_feedback_data,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;
```

## RLS (Row Level Security) Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE input_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallucination_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- User-specific data policies
CREATE POLICY "Users can view their own validation logs" ON input_validation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses" ON ai_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profiles" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admin policies for system monitoring
CREATE POLICY "Admins can view all quality monitoring data" ON quality_monitoring
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage system alerts" ON system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

## Data Retention Policies

```sql
-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_hallucination_data()
RETURNS VOID AS $$
BEGIN
  -- Remove validation logs older than 90 days
  DELETE FROM input_validation_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Remove performance analytics older than 1 year
  DELETE FROM performance_analytics 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Archive system alerts older than 6 months
  UPDATE system_alerts 
  SET alert_data = alert_data || '{"archived": true}'::jsonb
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND resolution_status = 'resolved';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule('cleanup-hallucination-data', '0 2 * * 0', 'SELECT cleanup_old_hallucination_data();');
```

## Migration Script

```sql
-- Migration to add all new tables
BEGIN;

-- Create new schema for hallucination prevention
CREATE SCHEMA IF NOT EXISTS hallucination_prevention;

-- Create all tables (as defined above)
-- ... [All table creation statements from above]

-- Add indexes
-- ... [All index creation statements from above]

-- Create functions
-- ... [All function creation statements from above]

-- Enable RLS and create policies
-- ... [All RLS policy statements from above]

-- Create cleanup job
-- ... [Cleanup function and cron job from above]

COMMIT;
```

## Summary

This database schema enhancement provides:

1. **Complete data tracking** for all 5 layers of hallucination prevention
2. **Performance optimization** through strategic indexing
3. **Security** through RLS policies
4. **Data integrity** through constraints and validation
5. **Automation** through database functions and cleanup jobs
6. **Scalability** through proper schema design and partitioning considerations

The schema supports the entire hallucination prevention workflow from input validation to real-time monitoring and learning.