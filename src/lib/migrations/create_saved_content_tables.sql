-- Create tables for Google Drive save functionality
-- This migration adds support for tracking saved content, user preferences, and metadata

-- Table for tracking what content has been saved by users
CREATE TABLE IF NOT EXISTS saved_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('message', 'conversation', 'highlighted_text')),
  conversation_id UUID,
  message_id UUID,
  content_preview TEXT NOT NULL,
  full_content TEXT NOT NULL,
  save_format VARCHAR(20) NOT NULL DEFAULT 'txt' CHECK (save_format IN ('txt', 'pdf', 'docx', 'markdown')),
  file_name VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255),
  drive_file_url TEXT,
  folder_path TEXT,
  ai_enhanced BOOLEAN DEFAULT false,
  ai_summary TEXT,
  ai_tags TEXT[], -- Array of AI-generated tags
  ai_themes TEXT[], -- Array of conversation themes
  metadata JSONB, -- Additional metadata (timestamps, context, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user Google Drive preferences
CREATE TABLE IF NOT EXISTS drive_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_connected BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  auto_sync BOOLEAN DEFAULT true,
  preferred_folder VARCHAR(255) DEFAULT 'StudyBuddy/Saved Content',
  save_format_default VARCHAR(20) DEFAULT 'txt' CHECK (save_format_default IN ('txt', 'pdf', 'docx', 'markdown')),
  ai_enhancement BOOLEAN DEFAULT true,
  create_summaries BOOLEAN DEFAULT true,
  auto_tagging BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily' CHECK (backup_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  allowed_mime_types TEXT[] DEFAULT ARRAY['text/plain', 'text/markdown', 'application/pdf'],
  max_file_size_mb INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for save history and quick access
CREATE TABLE IF NOT EXISTS save_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_content_id UUID NOT NULL REFERENCES saved_content(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('saved', 'shared', 'downloaded', 'deleted')),
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_device VARCHAR(50),
  ip_address INET,
  user_agent TEXT
);

-- Table for Google Drive folder structure organization
CREATE TABLE IF NOT EXISTS drive_folder_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  folder_path TEXT NOT NULL,
  folder_type VARCHAR(50) NOT NULL CHECK (folder_type IN ('conversations', 'messages', 'highlights', 'summaries', 'templates', 'custom')),
  parent_folder_id UUID REFERENCES drive_folder_structure(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_conversation_id ON saved_content(conversation_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_created_at ON saved_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_content_content_type ON saved_content(content_type);
CREATE INDEX IF NOT EXISTS idx_saved_content_drive_file_id ON saved_content(drive_file_id) WHERE drive_file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drive_user_preferences_user_id ON drive_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_user_preferences_is_connected ON drive_user_preferences(is_connected) WHERE is_connected = true;

CREATE INDEX IF NOT EXISTS idx_save_history_user_id ON save_history(user_id);
CREATE INDEX IF NOT EXISTS idx_save_history_saved_content_id ON save_history(saved_content_id);
CREATE INDEX IF NOT EXISTS idx_save_history_action_timestamp ON save_history(action_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_drive_folder_structure_user_id ON drive_folder_structure(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_folder_structure_parent_id ON drive_folder_structure(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_drive_folder_structure_type ON drive_folder_structure(folder_type);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_folder_structure ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_content
CREATE POLICY "saved_content_select_policy" ON saved_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_content_insert_policy" ON saved_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_content_update_policy" ON saved_content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "saved_content_delete_policy" ON saved_content
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for drive_user_preferences
CREATE POLICY "drive_preferences_select_policy" ON drive_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "drive_preferences_insert_policy" ON drive_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "drive_preferences_update_policy" ON drive_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for save_history
CREATE POLICY "save_history_select_policy" ON save_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "save_history_insert_policy" ON save_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for drive_folder_structure
CREATE POLICY "folder_structure_select_policy" ON drive_folder_structure
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "folder_structure_insert_policy" ON drive_folder_structure
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "folder_structure_update_policy" ON drive_folder_structure
  FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_content_updated_at BEFORE UPDATE ON saved_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_user_preferences_updated_at BEFORE UPDATE ON drive_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();