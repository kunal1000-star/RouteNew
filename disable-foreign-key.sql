-- Disable foreign key constraint temporarily for testing
-- This will allow memory storage to work without requiring a users table

-- Drop the foreign key constraint
ALTER TABLE conversation_memory DROP CONSTRAINT IF EXISTS conversation_memory_user_id_fkey;