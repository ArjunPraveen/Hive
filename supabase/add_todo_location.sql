-- Add location column to todos
-- Run in Supabase SQL Editor

ALTER TABLE todos ADD COLUMN location text DEFAULT NULL;
