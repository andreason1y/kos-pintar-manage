
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'daily-billing-job',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uacrgnjfcueempfcydqu.supabase.co/functions/v1/daily-billing',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY3JnbmpmY3VlZW1wZmN5ZHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTQ4MTYsImV4cCI6MjA5MDg3MDgxNn0.4ysKw1_iiVhBNtmzSudbNO24HNy9zsEnQTrGSv_Ipl8"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
