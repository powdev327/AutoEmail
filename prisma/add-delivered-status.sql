-- Add DELIVERED to Status enum if it doesn't exist
-- Run this in your Neon database SQL editor

-- Check if DELIVERED already exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DELIVERED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Status')
    ) THEN
        ALTER TYPE "Status" ADD VALUE 'DELIVERED';
    END IF;
END $$;

