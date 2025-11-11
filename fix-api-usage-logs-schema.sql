-- Fix API Usage Logs Schema - Add missing tier_used column
-- This fixes the PGRST204 error: "Could not find the 'tier_used' column"

-- First, check if the table exists
DO $$ 
BEGIN
    -- Check if api_usage_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_usage_logs') THEN
        -- Check if tier_used column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'api_usage_logs' AND column_name = 'tier_used'
        ) THEN
            -- Add the missing tier_used column
            ALTER TABLE api_usage_logs 
            ADD COLUMN tier_used TEXT DEFAULT 'free' NOT NULL;
            
            -- Add a comment to document the column
            COMMENT ON COLUMN api_usage_logs.tier_used IS 'API tier used (free, pro, enterprise)';
            
            RAISE NOTICE '✅ Successfully added tier_used column to api_usage_logs table';
        ELSE
            RAISE NOTICE 'ℹ️ tier_used column already exists in api_usage_logs table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ api_usage_logs table does not exist';
    END IF;
END $$;

-- Update any existing records to have a default tier
UPDATE api_usage_logs SET tier_used = 'free' WHERE tier_used IS NULL;