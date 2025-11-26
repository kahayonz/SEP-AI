-- Migration: Add adjusted_ai_score and human_evaluation columns to submissions table
-- Run this migration in your Supabase SQL Editor

-- Add adjusted_ai_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'adjusted_ai_score'
    ) THEN
        ALTER TABLE submissions 
        ADD COLUMN adjusted_ai_score NUMERIC(5,2);
        
        COMMENT ON COLUMN submissions.adjusted_ai_score IS 'Professor-adjusted AI score (0-24)';
    END IF;
END $$;

-- Add human_evaluation column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'human_evaluation'
    ) THEN
        ALTER TABLE submissions 
        ADD COLUMN human_evaluation TEXT;
        
        COMMENT ON COLUMN submissions.human_evaluation IS 'JSON string containing human evaluation scores (innovation_score, collaboration_score, presentation_score)';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('adjusted_ai_score', 'human_evaluation');

