# US Market Sentiment Monitor

Hourly news-first sentiment monitoring for US market ETFs and mega-cap stocks. The MVP uses Next.js, TypeScript, Supabase Postgres, and Supabase Cron to collect market/news data, aggregate ticker sentiment, calculate market mood, and expose dashboard-ready read models.

## Local Setup

1. Install dependencies:

```powershell
& 'D:\Program Files\nodejs\npm.cmd' install
```

2. Copy environment variables from `.env.example` into `.env.local` and fill local values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FINNHUB_API_KEY=
MARKETAUX_API_KEY=
CRON_SECRET=
APP_BASE_URL=http://localhost:3000
```

3. Run the app:

```powershell
& 'D:\Program Files\nodejs\npm.cmd' run dev
```

The Supabase CLI is installed as a local dev dependency and is available through `npx supabase`; do not install it globally for this project.

## Supabase Migrations

The initial schema lives in `supabase/migrations/20260522000000_initial_schema.sql`. It creates the public tables, constraints, indexes, RLS policies, read grants, and initial ticker seed data.

Apply migrations to a linked Supabase project:

```powershell
& 'D:\Program Files\nodejs\npx.cmd' supabase db push
```

For a local database reset:

```powershell
& 'D:\Program Files\nodejs\npx.cmd' supabase db reset
```

`supabase db reset` requires a local Supabase stack, including Docker. If Docker or local Supabase config is missing, start/configure the local stack first with `npx supabase init` and `npx supabase start`.

## Cron Scheduling

The scheduling SQL lives in `supabase/sql/schedule_hourly_ingest.sql`. It enables `pg_cron` and `pg_net`, safely unschedules any existing `hourly-market-sentiment-ingest` job, and schedules a POST to `/api/cron/hourly-ingest` at minute 5 every hour.

Set database settings before running the scheduling SQL so secrets are not committed:

```sql
alter database postgres set app.settings.app_base_url = 'https://your-app.example.com';
alter database postgres set app.settings.cron_secret = '<cron_secret>';
```

Reconnect after changing database settings, then run `supabase/sql/schedule_hourly_ingest.sql` in the Supabase SQL editor or through `psql`.

The scheduled request sends:

```json
{ "source": "supabase-cron" }
```

with the header `Authorization: Bearer <cron_secret>`.

## Environment Variables

`NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by browser-safe clients.

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Browser-safe Supabase publishable key.

`SUPABASE_SERVICE_ROLE_KEY`: Server-only key for ingestion and writes. Never expose this in client code.

`FINNHUB_API_KEY`: Market data provider key.

`MARKETAUX_API_KEY`: News provider key.

`CRON_SECRET`: Shared secret required by the protected hourly ingest route.

`APP_BASE_URL`: Base URL used by cron and server-side callbacks.

## Verification

Run the local checks:

```powershell
& 'D:\Program Files\nodejs\npm.cmd' run typecheck
& 'D:\Program Files\nodejs\npm.cmd' run lint
& 'D:\Program Files\nodejs\npx.cmd' supabase --help
& 'D:\Program Files\nodejs\npx.cmd' supabase migration --help
& 'D:\Program Files\nodejs\npx.cmd' supabase db reset
```

Use `supabase db reset` to validate migrations locally when Docker and the local Supabase stack are available.
