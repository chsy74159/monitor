create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

do $$
begin
  if nullif(current_setting('app.settings.app_base_url', true), '') is null then
    raise exception 'Missing app.settings.app_base_url. Set it before scheduling the cron job.';
  end if;

  if nullif(current_setting('app.settings.cron_secret', true), '') is null then
    raise exception 'Missing app.settings.cron_secret. Set it before scheduling the cron job.';
  end if;
end
$$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'hourly-market-sentiment-ingest';

select cron.schedule(
  'hourly-market-sentiment-ingest',
  '5 * * * *',
  $$
    select net.http_post(
      url := rtrim(current_setting('app.settings.app_base_url'), '/') || '/api/cron/hourly-ingest',
      body := jsonb_build_object('source', 'supabase-cron'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
      ),
      timeout_milliseconds := 30000
    );
  $$
);
