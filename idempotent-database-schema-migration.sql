-- IDEMPOTENT DATABASE SCHEMA MIGRATION
-- Safe to run multiple times - handles all existing objects properly
-- Prioritizes log tables and resolves all console errors

-- ============================================================================
-- PHASE 1: CORE LOG TABLES (Highest Priority) - IF NOT EXISTS on all
-- ============================================================================

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Conversations Table  
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chat_type TEXT NOT NULL CHECK (chat_type IN ('general', 'study_assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model_used TEXT,
  provider_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  context_included BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Study Chat Memory Table
CREATE TABLE IF NOT EXISTS public.study_chat_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 5),
  tags TEXT[],
  source_conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Memory Summaries Table
CREATE TABLE IF NOT EXISTS public.memory_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary_text TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- API Usage Logs Table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  provider_used TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  latency_ms INTEGER,
  cached BOOLEAN DEFAULT false,
  cost_estimate DECIMAL(10,4) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Suggestions Table
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  context_data JSONB,
  is_viewed BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Conversation Memory Table
CREATE TABLE IF NOT EXISTS public.conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_data JSONB NOT NULL,
  memory_relevance_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Context Optimization Logs Table
CREATE TABLE IF NOT EXISTS public.context_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_context TEXT NOT NULL,
  optimized_context TEXT NOT NULL,
  optimization_score DECIMAL(3,2),
  tokens_before INTEGER,
  tokens_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Metrics Table
CREATE TABLE IF NOT EXISTS public.quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality_score DECIMAL(3,2) NOT NULL,
  metrics_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_id UUID,
  source_type TEXT,
  fact_type TEXT,
  verification_status TEXT CHECK (verification_status IN ('verified', 'disputed', 'pending')),
  reliability_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Sources Table
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  url TEXT,
  citation_count INTEGER DEFAULT 0,
  reliability_score DECIMAL(3,2),
  verification_status TEXT CHECK (verification_status IN ('verified', 'disputed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestion Generation Logs Table
CREATE TABLE IF NOT EXISTS public.suggestion_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_context JSONB,
  suggestions_count INTEGER,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestion Interactions Table
CREATE TABLE IF NOT EXISTS public.suggestion_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES ai_suggestions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'accepted', 'dismissed', 'feedback')),
  interaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: CORE APPLICATION TABLES - IF NOT EXISTS on all
-- ============================================================================

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  category TEXT CHECK (category IN ('JEE', 'BOARDS', 'OTHERS')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('JEE', 'BOARDS', 'OTHERS')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_board_certified BOOLEAN DEFAULT false,
  certification_date DATE,
  has_pending_questions BOOLEAN DEFAULT false,
  is_available_for_study BOOLEAN DEFAULT true,
  is_available_for_revision BOOLEAN DEFAULT true
);

-- Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_revised_date DATE,
  next_revision_date DATE,
  revision_count INTEGER DEFAULT 0,
  is_in_spare BOOLEAN DEFAULT false,
  spare_interval_days INTEGER DEFAULT 1,
  is_remaining BOOLEAN DEFAULT false,
  remaining_since_date DATE,
  studied_count INTEGER DEFAULT 0,
  is_spare_only BOOLEAN DEFAULT false,
  is_half_done BOOLEAN DEFAULT false,
  category TEXT CHECK (category IN ('JEE', 'BOARDS', 'OTHERS'))
);

-- Blocks Table
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  duration INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Study', 'Question', 'Revision')),
  category TEXT,
  status TEXT CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')) DEFAULT 'planned',
  topics TEXT[],
  chapters TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subject TEXT
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  duration_minutes INTEGER,
  session_type TEXT CHECK (session_type IN ('study', 'break')) DEFAULT 'study',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id BIGSERIAL PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_topics TEXT[] DEFAULT '{}',
  not_done_topics JSONB DEFAULT '{}',
  feedback_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Gamification Table
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_penalty_points INTEGER DEFAULT 0,
  experience_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_level INTEGER DEFAULT 1,
  total_topics_completed INTEGER DEFAULT 0,
  badges_earned JSONB DEFAULT '[]'::jsonb,
  last_activity_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student AI Profile Table
CREATE TABLE IF NOT EXISTS public.student_ai_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_text TEXT NOT NULL,
  strong_subjects TEXT[],
  weak_subjects TEXT[],
  learning_style TEXT,
  exam_target TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_ai_interaction TIMESTAMPTZ,
  ai_interaction_count INTEGER DEFAULT 0
);

-- Daily Activity Summary Table
CREATE TABLE IF NOT EXISTS public.daily_activity_summary (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INTEGER DEFAULT 0,
  blocks_completed_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  highlights JSONB,
  concerns JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: INDEXES - IF NOT EXISTS on all
-- ============================================================================

-- Log table indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_study_chat_memory_user_id ON public.study_chat_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON public.conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON public.knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_user_id ON public.suggestion_interactions(user_id);

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON public.chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON public.blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_summary_user_id ON public.daily_activity_summary(user_id);

-- ============================================================================
-- PHASE 4: TRIGGERS - DROP IF EXISTS before creating
-- ============================================================================

-- Function for updated_at trigger (CREATE OR REPLACE for safety)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS trg_chat_conversations_set_updated_at ON public.chat_conversations;
CREATE TRIGGER trg_chat_conversations_set_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blocks_set_updated_at ON public.blocks;
CREATE TRIGGER trg_blocks_set_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_gamification_set_updated_at ON public.user_gamification;
CREATE TRIGGER trg_user_gamification_set_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chapters_set_updated_at ON public.chapters;
CREATE TRIGGER trg_chapters_set_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_knowledge_base_set_updated_at ON public.knowledge_base;
CREATE TRIGGER trg_knowledge_base_set_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_knowledge_sources_set_updated_at ON public.knowledge_sources;
CREATE TRIGGER trg_knowledge_sources_set_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- VERIFICATION QUERY - Show results
-- ============================================================================

-- Verify critical tables exist
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'activity_logs', 'chat_conversations', 'chat_messages', 'study_chat_memory',
    'memory_summaries', 'api_usage_logs', 'analytics_events', 'ai_suggestions',
    'conversation_memory', 'context_optimization_logs', 'quality_metrics',
    'knowledge_base', 'knowledge_sources', 'suggestion_generation_logs',
    'suggestion_interactions', 'subjects', 'chapters', 'topics', 'blocks',
    'sessions', 'user_gamification', 'student_ai_profile', 'daily_activity_summary'
  );