-- Add missing level column to user_gamification table
-- This migration fixes the gamification initialization error

-- Check if the user_gamification table exists
DO $$
BEGIN
    -- If the table doesn't exist, create it with all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
        CREATE TABLE user_gamification (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            total_points_earned INTEGER DEFAULT 0,
            total_penalty_points INTEGER DEFAULT 0,
            current_level INTEGER DEFAULT 1,
            level INTEGER DEFAULT 1,  -- This is the missing column
            experience_points INTEGER DEFAULT 0,
            total_topics_completed INTEGER DEFAULT 0,
            badges_earned JSONB DEFAULT '[]'::jsonb,
            last_activity_date TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- If the table exists, check if level column exists and add it if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_gamification' AND column_name = 'level'
        ) THEN
            ALTER TABLE user_gamification ADD COLUMN level INTEGER DEFAULT 1;
        END IF;
    END IF;
END
$$;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);

-- Create index on level for gamification queries
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(level);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON user_gamification;
CREATE TRIGGER update_user_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON COLUMN user_gamification.level IS 'Current level based on experience points - used for gamification progression';