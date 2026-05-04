-- Daily Digest Email Worker — schema + cron schedule
-- Idempotent: safe to re-run.

-- 1. Opt-out toggle on profiles (default ON)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled boolean NOT NULL DEFAULT true;

-- 2. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Unschedule any prior version, then schedule daily digest
SELECT cron.unschedule('hive-daily-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'hive-daily-digest'
);

SELECT cron.schedule(
  'hive-daily-digest',
  '30 6 * * *',  -- 06:30 UTC = 12:00 PM IST
  $$
  SELECT net.http_post(
    url := 'https://zzenrrorooejujwtvscg.supabase.co/functions/v1/send-daily-digest',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify with: SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'hive-daily-digest';
-- View runs: SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hive-daily-digest') ORDER BY start_time DESC LIMIT 5;
-- Unschedule: SELECT cron.unschedule('hive-daily-digest');
