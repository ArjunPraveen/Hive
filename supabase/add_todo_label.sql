-- Add label column to todos
-- Run in Supabase SQL Editor

ALTER TABLE todos ADD COLUMN label text NOT NULL DEFAULT 'personal' CHECK (label IN ('personal', 'work'));
