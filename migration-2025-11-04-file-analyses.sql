-- File Analyses Database Migration
-- Creates tables for storing Google Drive file analysis results

-- Enable pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing file analyses
CREATE TABLE IF NOT EXISTS file_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL, -- Google Drive file ID
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, docx, image, text
    mime_type TEXT NOT NULL,
    file_size BIGINT,
    analysis_result JSONB NOT NULL, -- Complete analysis in JSON format
    topics TEXT[] DEFAULT '{}',
    concepts TEXT[] DEFAULT '{}',
    difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Intermediate',
    estimated_study_time INTEGER DEFAULT 60, -- in minutes
    subject TEXT DEFAULT 'Other',
    keywords TEXT[] DEFAULT '{}',
    summary TEXT,
    key_insights TEXT[] DEFAULT '{}',
    ai_recommendations TEXT[] DEFAULT '{}',
    embedding vector(1536), -- For semantic search
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 months'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking file upload progress and status
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    upload_status TEXT CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    processing_steps TEXT[] DEFAULT '{}', -- Array of completed steps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for linking analyses to study plans
CREATE TABLE IF NOT EXISTS analysis_study_plan_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES file_analyses(id) ON DELETE CASCADE,
    study_plan_id UUID, -- Reference to existing study plan
    topic_name TEXT NOT NULL,
    integration_status TEXT CHECK (integration_status IN ('not_linked', 'linked', 'scheduled')) DEFAULT 'not_linked',
    scheduled_date DATE,
    priority_score INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_analyses_user_id ON file_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_file_analyses_file_id ON file_analyses(file_id);
CREATE INDEX IF NOT EXISTS idx_file_analyses_subject ON file_analyses(subject);
CREATE INDEX IF NOT EXISTS idx_file_analyses_difficulty ON file_analyses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_file_analyses_active ON file_analyses(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_file_analyses_embedding ON file_analyses USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status);

CREATE INDEX IF NOT EXISTS idx_analysis_study_plan_user_id ON analysis_study_plan_links(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_study_plan_analysis_id ON analysis_study_plan_links(analysis_id);

-- Enable Row Level Security
ALTER TABLE file_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_study_plan_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own file analyses
CREATE POLICY "Users can view their own file analyses" ON file_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file analyses" ON file_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file analyses" ON file_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file analyses" ON file_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own file uploads
CREATE POLICY "Users can view their own file uploads" ON file_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file uploads" ON file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file uploads" ON file_uploads
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own analysis-study plan links
CREATE POLICY "Users can view their own study plan links" ON analysis_study_plan_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plan links" ON analysis_study_plan_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plan links" ON analysis_study_plan_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plan links" ON analysis_study_plan_links
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_file_analyses_updated_at BEFORE UPDATE ON file_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_study_plan_links_updated_at BEFORE UPDATE ON analysis_study_plan_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data (if needed)
-- No initial data needed for these tables as they are user-specific
