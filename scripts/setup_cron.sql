-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar: Toda segunda-feira às 00:00 (meia-noite)
SELECT cron.schedule(
    'generate-weekly-article-every-monday',
    '0 0 * * 1',
    $$
    SELECT net.http_post(
        url => 'https://bvtkplkxlgqqwikfuoya.supabase.co/functions/v1/generate-weekly-article',
        headers => '{"Content-Type": "application/json"}'
    );
    $$
);

-- Verificar se foi agendado
SELECT * FROM cron.job;
