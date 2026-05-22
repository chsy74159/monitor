create extension if not exists pgcrypto;

create table if not exists public.tickers (
  symbol text primary key,
  name text not null,
  asset_type text not null check (asset_type in ('etf', 'stock')),
  sector text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null references public.tickers(symbol) on update cascade,
  captured_at timestamptz not null,
  price numeric(18, 6),
  change_percent numeric(10, 4),
  volume bigint check (volume is null or volume >= 0),
  source text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (symbol, captured_at, source)
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null,
  url text not null unique,
  title text not null,
  summary text,
  published_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create table if not exists public.article_tickers (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  symbol text not null references public.tickers(symbol) on update cascade,
  relevance_score numeric(5, 4) not null check (relevance_score >= 0 and relevance_score <= 1),
  sentiment_score numeric(5, 4) not null check (sentiment_score >= -1 and sentiment_score <= 1),
  sentiment_label text not null check (sentiment_label in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default now(),
  primary key (article_id, symbol)
);

create table if not exists public.ticker_hourly_sentiment (
  id uuid primary key default gen_random_uuid(),
  symbol text not null references public.tickers(symbol) on update cascade,
  window_start timestamptz not null,
  news_count integer not null default 0 check (news_count >= 0),
  avg_sentiment numeric(5, 4) check (avg_sentiment is null or (avg_sentiment >= -1 and avg_sentiment <= 1)),
  positive_count integer not null default 0 check (positive_count >= 0),
  negative_count integer not null default 0 check (negative_count >= 0),
  neutral_count integer not null default 0 check (neutral_count >= 0),
  mention_heat numeric(10, 4) not null default 0 check (mention_heat >= 0),
  sentiment_velocity numeric(6, 4) not null default 0,
  price_change_percent numeric(10, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (symbol, window_start)
);

create table if not exists public.market_hourly_mood (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null unique,
  mood_label text not null check (mood_label in ('risk_on', 'neutral', 'risk_off')),
  mood_score numeric(5, 4) not null check (mood_score >= -1 and mood_score <= 1),
  etf_sentiment numeric(5, 4) not null check (etf_sentiment >= -1 and etf_sentiment <= 1),
  mega_cap_sentiment numeric(5, 4) not null check (mega_cap_sentiment >= -1 and mega_cap_sentiment <= 1),
  negative_breadth numeric(5, 4) not null check (negative_breadth >= 0 and negative_breadth <= 1),
  positive_breadth numeric(5, 4) not null check (positive_breadth >= 0 and positive_breadth <= 1),
  top_positive jsonb not null default '[]'::jsonb,
  top_negative jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_clusters (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null,
  label text not null,
  summary text not null,
  symbols text[] not null default '{}'::text[],
  score numeric(10, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (window_start, label)
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  symbol text references public.tickers(symbol) on update cascade,
  window_start timestamptz not null,
  alert_type text not null check (
    alert_type in (
      'sentiment_drop',
      'sentiment_spike',
      'news_volume_spike',
      'market_risk_off',
      'price_sentiment_divergence'
    )
  ),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  message text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists market_snapshots_symbol_captured_idx
  on public.market_snapshots (symbol, captured_at desc);

create index if not exists news_articles_published_idx
  on public.news_articles (published_at desc);

create index if not exists article_tickers_symbol_idx
  on public.article_tickers (symbol);

create index if not exists ticker_hourly_sentiment_symbol_window_idx
  on public.ticker_hourly_sentiment (symbol, window_start desc);

create index if not exists alert_events_window_idx
  on public.alert_events (window_start desc, severity);

alter table public.tickers enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.news_articles enable row level security;
alter table public.article_tickers enable row level security;
alter table public.ticker_hourly_sentiment enable row level security;
alter table public.market_hourly_mood enable row level security;
alter table public.topic_clusters enable row level security;
alter table public.alert_events enable row level security;

create policy "Public read tickers"
  on public.tickers
  for select
  to anon, authenticated
  using (true);

create policy "Public read ticker hourly sentiment"
  on public.ticker_hourly_sentiment
  for select
  to anon, authenticated
  using (true);

create policy "Public read market hourly mood"
  on public.market_hourly_mood
  for select
  to anon, authenticated
  using (true);

create policy "Public read topic clusters"
  on public.topic_clusters
  for select
  to anon, authenticated
  using (true);

create policy "Public read alert events"
  on public.alert_events
  for select
  to anon, authenticated
  using (true);

grant select on table
  public.tickers,
  public.ticker_hourly_sentiment,
  public.market_hourly_mood,
  public.topic_clusters,
  public.alert_events
to anon, authenticated;

revoke all on table
  public.market_snapshots,
  public.news_articles,
  public.article_tickers
from anon, authenticated;

insert into public.tickers (symbol, name, asset_type, sector, is_active)
values
  ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'Broad Market', true),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 'Technology', true),
  ('DIA', 'SPDR Dow Jones Industrial Average ETF Trust', 'etf', 'Broad Market', true),
  ('IWM', 'iShares Russell 2000 ETF', 'etf', 'Small Caps', true),
  ('NVDA', 'NVIDIA', 'stock', 'Semiconductors', true),
  ('TSLA', 'Tesla', 'stock', 'Consumer Discretionary', true),
  ('AAPL', 'Apple', 'stock', 'Technology', true),
  ('MSFT', 'Microsoft', 'stock', 'Technology', true),
  ('AMD', 'Advanced Micro Devices', 'stock', 'Semiconductors', true),
  ('META', 'Meta Platforms', 'stock', 'Communication Services', true),
  ('GOOGL', 'Alphabet', 'stock', 'Communication Services', true),
  ('AMZN', 'Amazon', 'stock', 'Consumer Discretionary', true),
  ('NFLX', 'Netflix', 'stock', 'Communication Services', true),
  ('AVGO', 'Broadcom', 'stock', 'Semiconductors', true)
on conflict (symbol) do update
set
  name = excluded.name,
  asset_type = excluded.asset_type,
  sector = excluded.sector,
  is_active = excluded.is_active,
  updated_at = now();
