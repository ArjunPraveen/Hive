-- Daily Digest Email Worker — schema + cron schedule
-- Run in Supabase SQL Editor.
-- IMPORTANT: Replace <PROJECT_REF> and <ANON_KEY> with values from
-- Supabase Dashboard → Project Settings → API.

-- 1. Opt-out toggle on profiles (default ON)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled boolean NOT NULL DEFAULT true;

-- 2. Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Unschedule any prior version, then schedule daily digest
SELECT cron.unschedule('hive-daily-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'hive-daily-digest'
);

SELECT cron.schedule(
  'hive-daily-digest',
  '30 4 * * *',  -- 04:30 UTC = 10:00 IST
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify with: SELECT * FROM cron.job WHERE jobname = 'hive-daily-digest';
-- Unschedule with: SELECT cron.unschedule('hive-daily-digest');
