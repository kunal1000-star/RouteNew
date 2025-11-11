-- Create Row Level Security (RLS) policies for conversation tables
-- ================================================================

-- Enable RLS on all conversation tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Conversations table policies
-- ============================

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own conversations (soft delete)
CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can view conversations they participate in (for future multi-user support)
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT user_id FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND is_active = TRUE
        )
    );

-- Conversation Messages table policies
-- ====================================

-- Users can view messages from their own conversations
CREATE POLICY "Users can view messages from their own conversations" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_messages.conversation_id 
            AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversation_messages.conversation_id 
            AND user_id = auth.uid() 
            AND is_active = TRUE
        )
    );

-- Users can insert messages into their own conversations
CREATE POLICY "Users can insert messages into their own conversations" ON conversation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_messages.conversation_id 
            AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversation_messages.conversation_id 
            AND user_id = auth.uid() 
            AND is_active = TRUE
        )
    );

-- Users can update messages they sent
CREATE POLICY "Users can update their own messages" ON conversation_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can soft delete their own messages
CREATE POLICY "Users can soft delete their own messages" ON conversation_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Conversation Memory table policies
-- ===================================

-- Users can view memory from their own conversations
CREATE POLICY "Users can view memory from their own conversations" ON conversation_memory
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert memory for their own conversations
CREATE POLICY "Users can insert memory for their own conversations" ON conversation_memory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own memory
CREATE POLICY "Users can update their own memory" ON conversation_memory
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own memory
CREATE POLICY "Users can delete their own memory" ON conversation_memory
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can read memory from conversations they participate in
CREATE POLICY "Users can read memory from participated conversations" ON conversation_memory
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_memory.conversation_id 
            AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversation_memory.conversation_id 
            AND user_id = auth.uid() 
            AND is_active = TRUE
        )
    );

-- Conversation Settings table policies
-- =====================================

-- Users can view settings for their own conversations
CREATE POLICY "Users can view settings for their own conversations" ON conversation_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert settings for their own conversations
CREATE POLICY "Users can insert settings for their own conversations" ON conversation_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update settings for their own conversations
CREATE POLICY "Users can update settings for their own conversations" ON conversation_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete settings for their own conversations
CREATE POLICY "Users can delete settings for their own conversations" ON conversation_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation Participants table policies
-- =========================================

-- Users can view participants of conversations they're part of
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_participants.conversation_id 
            AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = conversation_participants.conversation_id 
            AND cp2.user_id = auth.uid() 
            AND cp2.is_active = TRUE
        )
    );

-- Users can insert themselves as participants
CREATE POLICY "Users can insert themselves as participants" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can update participation if they're conversation owners
CREATE POLICY "Conversation owners can update participants" ON conversation_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_participants.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can remove themselves from conversations
CREATE POLICY "Users can remove themselves from conversations" ON conversation_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation owners can remove participants
CREATE POLICY "Conversation owners can remove participants" ON conversation_participants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_participants.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Security functions for advanced access control
-- ==============================================

-- Function to check if user is conversation owner
CREATE OR REPLACE FUNCTION is_conversation_owner(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversations 
        WHERE id = conversation_uuid 
        AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is conversation participant
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversation_uuid 
        AND user_id = user_uuid 
        AND is_active = TRUE
    ) OR is_conversation_owner(conversation_uuid, user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's conversation permissions
CREATE OR REPLACE FUNCTION get_conversation_permissions(conversation_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    permissions JSON := '{}';
    is_owner BOOLEAN;
    is_participant BOOLEAN;
BEGIN
    SELECT is_conversation_owner(conversation_uuid, user_uuid) INTO is_owner;
    SELECT is_conversation_participant(conversation_uuid, user_uuid) INTO is_participant;
    
    permissions := json_build_object(
        'owner', is_owner,
        'participant', is_participant,
        'can_read', is_participant,
        'can_write', is_participant,
        'can_delete', is_owner,
        'can_update_settings', is_owner OR is_participant,
        'can_add_participants', is_owner
    );
    
    RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_conversation_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_permissions(UUID, UUID) TO authenticated;