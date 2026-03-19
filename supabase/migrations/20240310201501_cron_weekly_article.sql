-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule: Every Monday at midnight
-- This cron job calls the generate-weekly-article function
SELECT cron.schedule(
    'generate-weekly-article-every-monday',
    '0 0 * * 1',  -- At 00:00 every Monday
    $$
    SELECT net.http_post(
        url => 'https://' || current_setting('app.settings.project_id') || '.supabase.co/functions/v1/generate-weekly-article',
        headers => '{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting('app.settings.SERVICE_ROLE_KEY")}'
    );
    $$
);
