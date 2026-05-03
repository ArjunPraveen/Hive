-- Add habits, habit_assignees, habit_checkins tables
-- Run in Supabase SQL Editor

-- 1. habits — the recurring goal definition
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'health',
  frequency_type text NOT NULL CHECK (frequency_type IN ('daily','weekly','custom')),
  frequency_count int DEFAULT 1,
  custom_days int[] DEFAULT NULL,
  created_by uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. habit_assignees — which users this habit applies to
CREATE TABLE habit_assignees (
  habit_id uuid NOT NULL REFERENCES habits ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  PRIMARY KEY (habit_id, user_id)
);

-- 3. habit_checkins — one row per user per day completion
CREATE TABLE habit_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  checked_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, user_id, checked_date)
);

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checkins ENABLE ROW LEVEL SECURITY;

-- habits policies
CREATE POLICY "Family members can view habits" ON habits FOR SELECT
  USING (family_id = get_my_family_id());
CREATE POLICY "Family members can create habits" ON habits FOR INSERT
  WITH CHECK (family_id = get_my_family_id());
CREATE POLICY "Family members can update habits" ON habits FOR UPDATE
  USING (family_id = get_my_family_id());
CREATE POLICY "Family members can delete habits" ON habits FOR DELETE
  USING (family_id = get_my_family_id());

-- habit_assignees policies
CREATE POLICY "Family members can view assignees" ON habit_assignees FOR SELECT
  USING (habit_id IN (SELECT id FROM habits WHERE family_id = get_my_family_id()));
CREATE POLICY "Family members can manage assignees" ON habit_assignees FOR ALL
  USING (habit_id IN (SELECT id FROM habits WHERE family_id = get_my_family_id()));

-- habit_checkins policies
CREATE POLICY "Family members can view checkins" ON habit_checkins FOR SELECT
  USING (habit_id IN (SELECT id FROM habits WHERE family_id = get_my_family_id()));
CREATE POLICY "Users can create own checkins" ON habit_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own checkins" ON habit_checkins FOR DELETE
  USING (user_id = auth.uid());
