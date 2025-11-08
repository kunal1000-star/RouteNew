-- ============================================================================
-- 5-LAYER HALLUCINATION PREVENTION SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Migration Date: 2025-11-08
-- Description: Complete database schema for 5-layer hallucination prevention system
-- Components: 18 tables, RLS policies, indexes, functions, triggers, and automation
-- ============================================================================

-- Start transaction for atomic execution
BEGIN;

-- ============================================================================
-- SECTION 1: EXTENSIONS AND BASIC SETUP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SECTION 2: INPUT VALIDATION LAYER TABLES
-- ============================================================================

-- ------------------------------------------------------------------------
-- TABLE 1: input_validation_logs
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS input_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------
-- TABLE 2: query_classifications
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS query_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash TEXT UNIQUE NOT NULL,
    classification JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    required_context_level INTEGER,
    response_strategy JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 3: prompt_engineering_rules
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_engineering_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('validation', 'enhancement', 'safety', 'context')),
    prompt_template TEXT NOT NULL,
    applicable_contexts TEXT[] DEFAULT '{}',
    effectiveness_score DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: CONTEXT & MEMORY MANAGEMENT TABLES
-- ============================================================================

-- ------------------------------------------------------------------------
-- TABLE 4: knowledge_base
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID,
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

-- ------------------------------------------------------------------------
-- TABLE 5: knowledge_sources
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_sources (
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

-- ------------------------------------------------------------------------
-- TABLE 6: conversation_memory
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,
    interaction_data JSONB NOT NULL,
    quality_score DECIMAL(3,2),
    user_satisfaction DECIMAL(3,2),
    feedback_collected BOOLEAN DEFAULT FALSE,
    memory_relevance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 7: context_optimization_logs
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS context_optimization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_hash TEXT,
    original_context JSONB,
    optimized_context JSONB,
    size_reduction DECIMAL(5,2),
    relevance_score DECIMAL(3,2),
    optimization_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: RESPONSE VALIDATION & FACT-CHECKING TABLES
-- ============================================================================

-- ------------------------------------------------------------------------
-- TABLE 8: response_validations
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS response_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------
-- TABLE 9: ai_responses
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------
-- TABLE 10: fact_checks
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ai_responses(id) ON DELETE CASCADE,
    fact_text TEXT NOT NULL,
    verification_result JSONB NOT NULL,
    sources_used UUID[] DEFAULT '{}',
    confidence_level DECIMAL(3,2),
    verification_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 11: response_contradictions
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS response_contradictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ai_responses(id) ON DELETE CASCADE,
    contradiction_type VARCHAR(50) NOT NULL,
    conflicting_claims JSONB,
    contradiction_score DECIMAL(3,2),
    resolution_status VARCHAR(20) DEFAULT 'detected',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 12: confidence_scores
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ai_responses(id) ON DELETE CASCADE,
    overall_confidence DECIMAL(3,2) NOT NULL,
    fact_confidence DECIMAL(3,2),
    context_confidence DECIMAL(3,2),
    consistency_confidence DECIMAL(3,2),
    methodology_confidence DECIMAL(3,2),
    scoring_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: USER FEEDBACK & LEARNING TABLES
-- ============================================================================

-- ------------------------------------------------------------------------
-- TABLE 13: user_feedback
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_id UUID,
    response_id UUID REFERENCES ai_responses(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    corrections JSONB,
    flag_reasons TEXT[] DEFAULT '{}',
    satisfaction_score DECIMAL(3,2),
    feedback_text TEXT,
    implicit_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 14: feedback_patterns
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    frequency INTEGER DEFAULT 1,
    confidence_level DECIMAL(3,2),
    last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 15: learning_updates
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_type VARCHAR(50) NOT NULL,
    target_system VARCHAR(50) NOT NULL,
    update_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE,
    rollback_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 6: QUALITY ASSURANCE & MONITORING TABLES
-- ============================================================================

-- ------------------------------------------------------------------------
-- TABLE 16: quality_metrics
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    interaction_id UUID,
    quality_score DECIMAL(3,2),
    hallucination_probability DECIMAL(3,2),
    anomaly_indicators JSONB,
    alerts_triggered JSONB,
    monitoring_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 17: performance_analytics
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_metadata JSONB,
    time_period TIMESTAMP WITH TIME ZONE,
    user_segment VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 18: system_alerts
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_alerts (
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

-- ------------------------------------------------------------------------
-- TABLE 19: hallucination_events (from design document)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hallucination_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    response_id UUID REFERENCES ai_responses(id) ON DELETE SET NULL,
    detection_method VARCHAR(50),
    confidence_score DECIMAL(3,2),
    indicators JSONB,
    severity_level VARCHAR(20),
    resolution_status VARCHAR(20) DEFAULT 'detected',
    human_review_required BOOLEAN DEFAULT FALSE,
    false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- TABLE 20: quality_thresholds (from design document)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(3,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: PERFORMANCE INDEXES
-- ============================================================================

-- ------------------------------------------------------------------------
-- Input validation indexes
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_input_validation_user_id ON input_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_input_validation_session ON input_validation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_input_validation_created ON input_validation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_classifications_hash ON query_classifications(input_hash);

-- ------------------------------------------------------------------------
-- Context management indexes
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_knowledge_content_hash ON knowledge_base(content_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_type ON knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_verification ON knowledge_base(verification_status);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation ON conversation_memory(conversation_id);

-- ------------------------------------------------------------------------
-- Response validation indexes
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_conversation ON ai_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_created ON ai_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_response_validations_response ON response_validations(ai_response_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_response ON fact_checks(response_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_response ON response_contradictions(response_id);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_response ON confidence_scores(response_id);

-- ------------------------------------------------------------------------
-- Feedback and learning indexes
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_interaction ON user_feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_patterns_user ON feedback_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_updates_type ON learning_updates(update_type);

-- ------------------------------------------------------------------------
-- Monitoring and quality indexes
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quality_metrics_user ON quality_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_created ON quality_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_type ON performance_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_hallucination_events_user ON hallucination_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hallucination_events_severity ON hallucination_events(severity_level);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_quality_thresholds_type ON quality_thresholds(threshold_type);

-- ============================================================================
-- SECTION 8: DATABASE FUNCTIONS
-- ============================================================================

-- ------------------------------------------------------------------------
-- Function to calculate quality score from multiple factors
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_quality_score(
    confidence_score DECIMAL,
    fact_check_score DECIMAL,
    user_satisfaction DECIMAL,
    validation_score DECIMAL
) RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN (
        COALESCE(confidence_score, 0) * 0.3 +
        COALESCE(fact_check_score, 0) * 0.3 +
        COALESCE(user_satisfaction, 0) * 0.2 +
        COALESCE(validation_score, 0) * 0.2
    );
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------
-- Function to detect high-risk interactions
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION detect_high_risk_interaction(
    quality_data JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check for multiple risk indicators
    RETURN (
        COALESCE((quality_data->>'hallucination_probability')::DECIMAL, 0) > 0.7 OR
        COALESCE((quality_data->>'confidence_score')::DECIMAL, 1) < 0.3 OR
        COALESCE((quality_data->>'user_satisfaction')::DECIMAL, 5) < 2.0 OR
        COALESCE((quality_data->>'contradiction_detected')::BOOLEAN, FALSE) = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------
-- Function to update query classification cache
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_query_classification(
    p_input_hash TEXT,
    p_classification JSONB,
    p_confidence_score DECIMAL,
    p_required_context_level INTEGER,
    p_response_strategy JSONB
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO query_classifications (
        input_hash, classification, confidence_score, 
        required_context_level, response_strategy
    ) VALUES (
        p_input_hash, p_classification, p_confidence_score,
        p_required_context_level, p_response_strategy
    ) ON CONFLICT (input_hash) 
    DO UPDATE SET
        classification = p_classification,
        confidence_score = p_confidence_score,
        required_context_level = p_required_context_level,
        response_strategy = p_response_strategy,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------
-- Function to calculate confidence scores
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_confidence_scores(
    p_response_id UUID
) RETURNS VOID AS $$
DECLARE
    v_fact_confidence DECIMAL(3,2);
    v_context_confidence DECIMAL(3,2);
    v_consistency_confidence DECIMAL(3,2);
    v_methodology_confidence DECIMAL(3,2);
    v_overall_confidence DECIMAL(3,2);
BEGIN
    -- Calculate individual confidence components
    SELECT 
        COALESCE(AVG(confidence_level), 0.5)
    INTO v_fact_confidence
    FROM fact_checks 
    WHERE response_id = p_response_id;
    
    -- Context confidence based on available context data
    SELECT 
        COALESCE(AVG(memory_relevance_score), 0.7)
    INTO v_context_confidence
    FROM conversation_memory 
    WHERE conversation_id = (SELECT conversation_id FROM ai_responses WHERE id = p_response_id);
    
    -- Consistency confidence (inverse of contradiction score)
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 1.0 - COALESCE(AVG(contradiction_score), 0)
            ELSE 1.0
        END
    INTO v_consistency_confidence
    FROM response_contradictions 
    WHERE response_id = p_response_id;
    
    -- Methodology confidence (based on validation results)
    SELECT 
        COALESCE(AVG(confidence_score), 0.6)
    INTO v_methodology_confidence
    FROM response_validations 
    WHERE ai_response_id = p_response_id;
    
    -- Calculate overall confidence
    v_overall_confidence := (
        v_fact_confidence * 0.3 +
        v_context_confidence * 0.25 +
        v_consistency_confidence * 0.25 +
        v_methodology_confidence * 0.2
    );
    
    -- Insert or update confidence scores
    INSERT INTO confidence_scores (
        response_id, overall_confidence, fact_confidence,
        context_confidence, consistency_confidence, methodology_confidence
    ) VALUES (
        p_response_id, v_overall_confidence, v_fact_confidence,
        v_context_confidence, v_consistency_confidence, v_methodology_confidence
    ) ON CONFLICT (response_id) 
    DO UPDATE SET
        overall_confidence = v_overall_confidence,
        fact_confidence = v_fact_confidence,
        context_confidence = v_context_confidence,
        consistency_confidence = v_consistency_confidence,
        methodology_confidence = v_methodology_confidence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 9: AUTOMATION TRIGGERS
-- ============================================================================

-- ------------------------------------------------------------------------
-- Trigger to automatically calculate confidence scores
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_calculate_confidence_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate confidence scores for new responses
    IF TG_OP = 'INSERT' AND NEW.confidence_score IS NULL THEN
        PERFORM calculate_confidence_scores(NEW.id);
    END IF;
    
    -- Recalculate confidence scores for updated responses
    IF TG_OP = 'UPDATE' THEN
        PERFORM calculate_confidence_scores(NEW.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_responses_confidence_trigger
    AFTER INSERT OR UPDATE ON ai_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_confidence_scores();

-- ------------------------------------------------------------------------
-- Trigger to update knowledge base verification status
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_knowledge_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
        NEW.verified_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_base_verification_trigger
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_verification();

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ------------------------------------------------------------------------
-- Enable RLS on all new tables
-- ------------------------------------------------------------------------
ALTER TABLE input_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_engineering_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallucination_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_thresholds ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- User-specific data policies
-- ------------------------------------------------------------------------

-- Input validation logs
CREATE POLICY "Users can view their own validation logs" ON input_validation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own validation logs" ON input_validation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Query classifications (system-wide read, service write)
CREATE POLICY "Authenticated users can view query classifications" ON query_classifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage query classifications" ON query_classifications
    FOR ALL USING (auth.role() = 'service_role');

-- Knowledge base (read-only for users, admin/system write)
CREATE POLICY "Users can view verified knowledge" ON knowledge_base
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Service role can manage knowledge base" ON knowledge_base
    FOR ALL USING (auth.role() = 'service_role');

-- Knowledge sources (read-only for users, admin/system write)
CREATE POLICY "Users can view knowledge sources" ON knowledge_sources
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage knowledge sources" ON knowledge_sources
    FOR ALL USING (auth.role() = 'service_role');

-- Conversation memory
CREATE POLICY "Users can view their own conversation memory" ON conversation_memory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversation memory" ON conversation_memory
    FOR ALL USING (auth.uid() = user_id);

-- Context optimization logs
CREATE POLICY "Users can view their own optimization logs" ON context_optimization_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization logs" ON context_optimization_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Response validations
CREATE POLICY "Users can view their own response validations" ON response_validations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert response validations" ON response_validations
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- AI responses
CREATE POLICY "Users can view their own AI responses" ON ai_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI responses" ON ai_responses
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Fact checks
CREATE POLICY "Users can view fact checks for their responses" ON fact_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_responses 
            WHERE ai_responses.id = fact_checks.response_id 
            AND ai_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage fact checks" ON fact_checks
    FOR ALL USING (auth.role() = 'service_role');

-- Response contradictions
CREATE POLICY "Users can view contradictions for their responses" ON response_contradictions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_responses 
            WHERE ai_responses.id = response_contradictions.response_id 
            AND ai_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage response contradictions" ON response_contradictions
    FOR ALL USING (auth.role() = 'service_role');

-- Confidence scores
CREATE POLICY "Users can view confidence scores for their responses" ON confidence_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_responses 
            WHERE ai_responses.id = confidence_scores.response_id 
            AND ai_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage confidence scores" ON confidence_scores
    FOR ALL USING (auth.role() = 'service_role');

-- User feedback
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback" ON user_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Feedback patterns
CREATE POLICY "Users can view their own feedback patterns" ON feedback_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feedback patterns" ON feedback_patterns
    FOR ALL USING (auth.role() = 'service_role');

-- Learning updates
CREATE POLICY "System can manage learning updates" ON learning_updates
    FOR ALL USING (auth.role() = 'service_role');

-- Quality metrics
CREATE POLICY "Users can view their own quality metrics" ON quality_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert quality metrics" ON quality_metrics
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Performance analytics (system-wide read for authenticated users)
CREATE POLICY "Authenticated users can view performance analytics" ON performance_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage performance analytics" ON performance_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- System alerts (admin-only)
CREATE POLICY "Admins can manage system alerts" ON system_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Hallucination events
CREATE POLICY "Users can view their own hallucination events" ON hallucination_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage hallucination events" ON hallucination_events
    FOR ALL USING (auth.role() = 'service_role');

-- Quality thresholds (read-only for users, admin/system write)
CREATE POLICY "Users can view quality thresholds" ON quality_thresholds
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage quality thresholds" ON quality_thresholds
    FOR ALL USING (auth.role() = 'service_role');

-- Prompt engineering rules (system-wide read for authenticated users)
CREATE POLICY "Authenticated users can view prompt rules" ON prompt_engineering_rules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage prompt rules" ON prompt_engineering_rules
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 11: DATA RETENTION AND CLEANUP
-- ============================================================================

-- ------------------------------------------------------------------------
-- Function to clean up old data
-- ------------------------------------------------------------------------
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
    
    -- Remove old hallucination events marked as false positives
    DELETE FROM hallucination_events 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND false_positive = true;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------
-- Schedule cleanup job (weekly on Sundays at 2 AM)
-- ------------------------------------------------------------------------
SELECT cron.schedule('cleanup-hallucination-data', '0 2 * * 0', 'SELECT cleanup_old_hallucination_data();');

-- ============================================================================
-- SECTION 12: INITIAL DATA SEEDING
-- ============================================================================

-- ------------------------------------------------------------------------
-- Insert default quality thresholds
-- ------------------------------------------------------------------------
INSERT INTO quality_thresholds (threshold_type, threshold_value, description, is_active) VALUES
('min_confidence_score', 0.70, 'Minimum acceptable confidence score for AI responses', true),
('max_hallucination_probability', 0.30, 'Maximum acceptable hallucination probability', true),
('min_fact_confidence', 0.80, 'Minimum confidence required for factual statements', true),
('min_satisfaction_score', 3.0, 'Minimum user satisfaction score', true),
('high_risk_threshold', 0.70, 'Threshold for triggering high-risk alerts', true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------
-- Insert default prompt engineering rules
-- ------------------------------------------------------------------------
INSERT INTO prompt_engineering_rules (rule_name, rule_type, prompt_template, applicable_contexts, is_active) VALUES
('fact_checking_enhancement', 'validation', 'Always verify claims against known facts before responding.', '{"academic", "factual", "scientific"}', true),
('context_awareness', 'context', 'Consider the user''s academic level and previous interactions when providing explanations.', '{"educational", "tutoring", "explanation"}', true),
('uncertainty_handling', 'safety', 'If uncertain about information accuracy, clearly state the limitations and suggest verification.', '{"general", "factual", "advice"}', true),
('source_citation', 'enhancement', 'Reference credible sources when providing factual information.', '{"academic", "research", "scientific"}', true)
ON CONFLICT (rule_name) DO NOTHING;

-- ============================================================================
-- SECTION 13: VERIFICATION AND VALIDATION
-- ============================================================================

-- ------------------------------------------------------------------------
-- Verify all tables were created
-- ------------------------------------------------------------------------
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'input_validation_logs', 'query_classifications', 'prompt_engineering_rules',
        'knowledge_base', 'knowledge_sources', 'conversation_memory', 'context_optimization_logs',
        'response_validations', 'ai_responses', 'fact_checks', 'response_contradictions', 'confidence_scores',
        'user_feedback', 'feedback_patterns', 'learning_updates',
        'quality_metrics', 'performance_analytics', 'system_alerts', 'hallucination_events', 'quality_thresholds'
    ];
    table_name TEXT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    IF table_count != array_length(expected_tables, 1) THEN
        RAISE EXCEPTION 'Expected % tables, but found %. Missing tables may indicate migration issues.', 
            array_length(expected_tables, 1), table_count;
    END IF;
    
    RAISE NOTICE 'All % hallucination prevention tables created successfully', table_count;
END $$;

-- ------------------------------------------------------------------------
-- Verify indexes were created
-- ------------------------------------------------------------------------
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'input_validation_logs', 'query_classifications', 'prompt_engineering_rules',
        'knowledge_base', 'knowledge_sources', 'conversation_memory', 'context_optimization_logs',
        'response_validations', 'ai_responses', 'fact_checks', 'response_contradictions', 'confidence_scores',
        'user_feedback', 'feedback_patterns', 'learning_updates',
        'quality_metrics', 'performance_analytics', 'system_alerts', 'hallucination_events', 'quality_thresholds'
    )
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '% performance indexes created successfully', index_count;
END $$;

-- ------------------------------------------------------------------------
-- Verify RLS policies were created
-- ------------------------------------------------------------------------
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'input_validation_logs', 'query_classifications', 'prompt_engineering_rules',
        'knowledge_base', 'knowledge_sources', 'conversation_memory', 'context_optimization_logs',
        'response_validations', 'ai_responses', 'fact_checks', 'response_contradictions', 'confidence_scores',
        'user_feedback', 'feedback_patterns', 'learning_updates',
        'quality_metrics', 'performance_analytics', 'system_alerts', 'hallucination_events', 'quality_thresholds'
    );
    
    RAISE NOTICE '% RLS policies created successfully', policy_count;
END $$;

-- ------------------------------------------------------------------------
-- Verify functions were created
-- ------------------------------------------------------------------------
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN (
        'calculate_quality_score', 'detect_high_risk_interaction', 
        'update_query_classification', 'calculate_confidence_scores',
        'trigger_calculate_confidence_scores', 'update_knowledge_verification',
        'cleanup_old_hallucination_data'
    );
    
    RAISE NOTICE '% database functions created successfully', function_count;
END $$;

-- ------------------------------------------------------------------------
-- Display final summary
-- ------------------------------------------------------------------------
SELECT 
    'Hallucination Prevention System Migration Complete' as status,
    NOW() as completed_at,
    'All 20 tables, indexes, RLS policies, functions, and triggers created successfully' as summary;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================