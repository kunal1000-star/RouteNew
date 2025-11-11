-- Create comprehensive conversation persistence tables
-- ======================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table for storing conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    chat_type TEXT NOT NULL DEFAULT 'general' CHECK (chat_type IN ('general', 'study_assistant', 'tutoring', 'review')),
    metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Create conversation_messages table for storing individual messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_used TEXT,
    provider_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER,
    context_included BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation memory table for enhanced memory integration
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL DEFAULT 'general' CHECK (memory_type IN ('general', 'learning_interaction', 'personal_info', 'study_preference', 'performance_data')),
    content TEXT NOT NULL,
    interaction_data JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.5,
    user_satisfaction DECIMAL(3,2),
    feedback_collected BOOLEAN DEFAULT FALSE,
    memory_relevance_score DECIMAL(3,2) DEFAULT 0.5,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    retention TEXT DEFAULT 'medium_term' CHECK (retention IN ('short_term', 'medium_term', 'long_term', 'permanent')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    linked_memories UUID[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0
);

-- Create conversation settings table for per-conversation preferences
CREATE TABLE IF NOT EXISTS conversation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_provider TEXT DEFAULT 'groq',
    ai_model TEXT DEFAULT 'llama-3.1-8b-instant',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    stream_responses BOOLEAN DEFAULT TRUE,
    include_memory_context BOOLEAN DEFAULT TRUE,
    include_personal_context BOOLEAN DEFAULT TRUE,
    auto_save BOOLEAN DEFAULT TRUE,
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation participants table for future multi-user support
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('owner', 'participant', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chat_type ON conversations(chat_type);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(is_pinned);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON conversations(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(conversation_id, conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation_id ON conversation_memory(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_memory_type ON conversation_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_active ON conversation_memory(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_tags ON conversation_memory USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_relevance ON conversation_memory(memory_relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_settings_conversation_id ON conversation_settings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_settings_user_id ON conversation_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_messages_updated_at ON conversation_messages;
CREATE TRIGGER update_conversation_messages_updated_at 
    BEFORE UPDATE ON conversation_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER update_conversation_memory_updated_at 
    BEFORE UPDATE ON conversation_memory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_settings_updated_at ON conversation_settings;
CREATE TRIGGER update_conversation_settings_updated_at 
    BEFORE UPDATE ON conversation_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation last activity and message count
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the conversation's last activity and message count
    UPDATE conversations 
    SET 
        last_activity_at = NEW.created_at,
        message_count = (
            SELECT COUNT(*) 
            FROM conversation_messages 
            WHERE conversation_id = NEW.conversation_id 
            AND is_deleted = FALSE
        ),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversation stats updates
DROP TRIGGER IF EXISTS update_conversation_stats_trigger ON conversation_messages;
CREATE TRIGGER update_conversation_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- Function to auto-generate conversation titles
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
DECLARE
    first_message TEXT;
    title TEXT;
BEGIN
    -- Only generate title if it's still the default
    IF NEW.title = 'New Conversation' OR NEW.title IS NULL THEN
        -- Get the first user message
        SELECT content INTO first_message
        FROM conversation_messages
        WHERE conversation_id = NEW.id
        AND role = 'user'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Generate title based on first message
        IF first_message IS NOT NULL THEN
            -- Take first 50 characters and clean it up
            title := SUBSTRING(first_message FROM 1 FOR 50);
            -- Remove extra whitespace
            title := TRIM(REGEXP_REPLACE(title, '\s+', ' ', 'g'));
            -- Add ellipsis if truncated
            IF LENGTH(first_message) > 50 THEN
                title := title || '...';
            END IF;
            -- If title is too short, use a default
            IF LENGTH(title) < 3 THEN
                title := 'New Chat';
            END IF;
        ELSE
            title := 'New Chat';
        END IF;
        
        NEW.title := title;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-generating titles
DROP TRIGGER IF EXISTS generate_conversation_title_trigger ON conversations;
CREATE TRIGGER generate_conversation_title_trigger
    BEFORE INSERT OR UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION generate_conversation_title();