# US Market Sentiment Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a low-cost, hourly refreshed US stock market sentiment dashboard using news-first sentiment, Supabase storage, and a Vercel-hosted Next.js app.

**Architecture:** The app is a Next.js App Router project with pure TypeScript domain modules for scoring, attribution, aggregation, and alerts. Supabase stores normalized market snapshots, news articles, hourly ticker sentiment, market mood, topics, and alert events; Supabase Cron calls a protected Vercel API route every hour.

**Tech Stack:** Next.js, React, TypeScript, Supabase Postgres, `@supabase/supabase-js`, Vitest, React Testing Library, Recharts, Vercel, Supabase Cron.

---

## File Structure

Create these files and keep responsibilities narrow:

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript configuration.
- `next.config.ts`: Next.js configuration.
- `vitest.config.ts`: Vitest and React Testing Library configuration.
- `vitest.setup.ts`: test DOM setup.
- `.env.example`: environment variable names without secrets.
- `app/layout.tsx`: root HTML shell.
- `app/page.tsx`: dashboard page composition.
- `app/globals.css`: dashboard visual system.
- `app/api/dashboard/latest/route.ts`: latest dashboard JSON endpoint.
- `app/api/tickers/[symbol]/history/route.ts`: ticker history JSON endpoint.
- `app/api/cron/hourly-ingest/route.ts`: protected ingest endpoint.
- `components/dashboard/market-mood-panel.tsx`: market mood summary.
- `components/dashboard/ticker-table.tsx`: sortable ticker table.
- `components/dashboard/trend-chart.tsx`: sentiment trend chart.
- `components/dashboard/topic-list.tsx`: topic cluster list.
- `components/dashboard/alert-list.tsx`: alert event list.
- `lib/config/tickers.ts`: initial ticker universe.
- `lib/domain/types.ts`: shared domain types.
- `lib/domain/sentiment.ts`: rule-based sentiment scoring.
- `lib/domain/ticker-attribution.ts`: article-to-ticker attribution.
- `lib/domain/aggregation.ts`: hourly ticker and market mood aggregation.
- `lib/domain/alerts.ts`: alert rule evaluation.
- `lib/providers/market-data.ts`: market data provider interface and Finnhub client.
- `lib/providers/news.ts`: news provider interface and Marketaux client.
- `lib/supabase/server.ts`: server-only Supabase clients.
- `lib/repositories/dashboard-repository.ts`: read/write database adapter.
- `lib/ingest/hourly-pipeline.ts`: orchestrates hourly ingestion.
- `lib/ingest/time.ts`: hour-window helpers.
- `test/fixtures/articles.ts`: reusable news fixtures.
- `test/fixtures/snapshots.ts`: reusable market snapshot fixtures.
- `test/lib/domain/*.test.ts`: unit tests for pure domain logic.
- `test/lib/ingest/hourly-pipeline.test.ts`: integration-style ingest pipeline test with mocks.
- `supabase/migrations/20260522000000_initial_schema.sql`: migration for schema, RLS, policies, indexes, and seed tickers.
- `supabase/sql/schedule_hourly_ingest.sql`: parameterized Supabase Cron scheduling script.
- `README.md`: local setup, environment variables, verification commands, deployment notes.

Before implementation, fetch current Supabase docs and changelog for RLS, API keys, Cron, and `pg_net`. If the Supabase CLI is used, run `supabase --help` and `supabase migration --help` before creating migrations.

---

### Task 1: Project Scaffold And Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`

- [ ] **Step 1: Create the base package manifest**

Create `package.json`:

```json
{
  "name": "us-market-sentiment-monitor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.2.0",
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.24.0",
    "eslint-config-next": "^15.3.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create TypeScript and Next config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true
};

export default nextConfig;
```

- [ ] **Step 3: Configure tests**

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add environment variable template**

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FINNHUB_API_KEY=
MARKETAUX_API_KEY=
CRON_SECRET=
APP_BASE_URL=http://localhost:3000
```

- [ ] **Step 5: Create the minimal app shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "US Market Sentiment Monitor",
  description: "Hourly news-first sentiment dashboard for US market ETFs and mega-cap stocks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css`:

```css
:root {
  color-scheme: dark;
  --bg: #0b0d10;
  --panel: #15191f;
  --panel-soft: #1d232b;
  --line: #2a323d;
  --text: #eef3f7;
  --muted: #96a3af;
  --good: #49c787;
  --bad: #ff6b6b;
  --warn: #f2b84b;
  --accent: #5fb3ff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
select {
  font: inherit;
}

.dashboard-shell {
  min-height: 100vh;
  padding: 24px;
}
```

Create `app/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <h1>US Market Sentiment Monitor</h1>
      <p>Dashboard scaffold is ready.</p>
    </main>
  );
}
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Verify the scaffold**

Run:

```bash
npm run typecheck
npm test
```

Expected: `npm run typecheck` passes. `npm test` exits successfully with no tests found or zero matched suites depending on Vitest version.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts vitest.setup.ts .env.example app
git commit -m "chore: scaffold next sentiment dashboard"
```

---

### Task 2: Domain Types And Ticker Registry

**Files:**
- Create: `lib/domain/types.ts`
- Create: `lib/config/tickers.ts`
- Create: `test/lib/config/tickers.test.ts`

- [ ] **Step 1: Write ticker registry tests**

Create `test/lib/config/tickers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getActiveTickers, MONITORED_TICKERS } from "@/lib/config/tickers";

describe("ticker registry", () => {
  it("contains the approved ETF and stock universe", () => {
    expect(MONITORED_TICKERS.map((ticker) => ticker.symbol)).toEqual([
      "SPY",
      "QQQ",
      "DIA",
      "IWM",
      "NVDA",
      "TSLA",
      "AAPL",
      "MSFT",
      "AMD",
      "META",
      "GOOGL",
      "AMZN",
      "NFLX",
      "AVGO"
    ]);
  });

  it("returns only active tickers", () => {
    expect(getActiveTickers().every((ticker) => ticker.isActive)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- test/lib/config/tickers.test.ts
```

Expected: FAIL because `@/lib/config/tickers` does not exist.

- [ ] **Step 3: Add shared domain types**

Create `lib/domain/types.ts`:

```ts
export type AssetType = "etf" | "stock";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type MarketMoodLabel = "risk_on" | "neutral" | "risk_off";
export type AlertSeverity = "info" | "warning" | "critical";

export interface TickerConfig {
  symbol: string;
  name: string;
  assetType: AssetType;
  sector: string;
  isActive: boolean;
}

export interface MarketSnapshot {
  symbol: string;
  capturedAt: string;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  source: string;
  raw?: unknown;
}

export interface NewsArticle {
  externalId: string | null;
  source: string;
  url: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  symbols: string[];
  raw?: unknown;
}

export interface ArticleTickerSentiment {
  articleUrl: string;
  symbol: string;
  relevanceScore: number;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
}

export interface TickerHourlySentiment {
  symbol: string;
  windowStart: string;
  newsCount: number;
  avgSentiment: number | null;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mentionHeat: number;
  sentimentVelocity: number;
  priceChangePercent: number | null;
}

export interface MarketHourlyMood {
  windowStart: string;
  moodLabel: MarketMoodLabel;
  moodScore: number;
  etfSentiment: number;
  megaCapSentiment: number;
  negativeBreadth: number;
  positiveBreadth: number;
  topPositive: TickerHourlySentiment[];
  topNegative: TickerHourlySentiment[];
}

export interface TopicCluster {
  id: string;
  windowStart: string;
  label: string;
  summary: string;
  symbols: string[];
  score: number;
}

export interface AlertEvent {
  symbol: string | null;
  windowStart: string;
  alertType: "sentiment_drop" | "sentiment_spike" | "news_volume_spike" | "market_risk_off" | "price_sentiment_divergence";
  severity: AlertSeverity;
  message: string;
  metrics: Record<string, unknown>;
}
```

- [ ] **Step 4: Add ticker config**

Create `lib/config/tickers.ts`:

```ts
import type { TickerConfig } from "@/lib/domain/types";

export const MONITORED_TICKERS: TickerConfig[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", assetType: "etf", sector: "Broad Market", isActive: true },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetType: "etf", sector: "Technology", isActive: true },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF Trust", assetType: "etf", sector: "Broad Market", isActive: true },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", assetType: "etf", sector: "Small Caps", isActive: true },
  { symbol: "NVDA", name: "NVIDIA", assetType: "stock", sector: "Semiconductors", isActive: true },
  { symbol: "TSLA", name: "Tesla", assetType: "stock", sector: "Consumer Discretionary", isActive: true },
  { symbol: "AAPL", name: "Apple", assetType: "stock", sector: "Technology", isActive: true },
  { symbol: "MSFT", name: "Microsoft", assetType: "stock", sector: "Technology", isActive: true },
  { symbol: "AMD", name: "Advanced Micro Devices", assetType: "stock", sector: "Semiconductors", isActive: true },
  { symbol: "META", name: "Meta Platforms", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "GOOGL", name: "Alphabet", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "AMZN", name: "Amazon", assetType: "stock", sector: "Consumer Discretionary", isActive: true },
  { symbol: "NFLX", name: "Netflix", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "AVGO", name: "Broadcom", assetType: "stock", sector: "Semiconductors", isActive: true }
];

export function getActiveTickers(): TickerConfig[] {
  return MONITORED_TICKERS.filter((ticker) => ticker.isActive);
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- test/lib/config/tickers.test.ts
npm run typecheck
git add lib/domain/types.ts lib/config/tickers.ts test/lib/config/tickers.test.ts
git commit -m "feat: add monitored ticker registry"
```

Expected: tests and typecheck pass.

---

### Task 3: Sentiment Scoring And Ticker Attribution

**Files:**
- Create: `lib/domain/sentiment.ts`
- Create: `lib/domain/ticker-attribution.ts`
- Create: `test/fixtures/articles.ts`
- Create: `test/lib/domain/sentiment.test.ts`
- Create: `test/lib/domain/ticker-attribution.test.ts`

- [ ] **Step 1: Add article fixtures**

Create `test/fixtures/articles.ts`:

```ts
import type { NewsArticle } from "@/lib/domain/types";

export const bullishNvidiaArticle: NewsArticle = {
  externalId: "news-1",
  source: "fixture",
  url: "https://example.com/nvda-beats",
  title: "Nvidia beats expectations and raises guidance on strong AI demand",
  summary: "Analysts point to record revenue and resilient data center growth.",
  publishedAt: "2026-05-22T14:00:00.000Z",
  symbols: ["NVDA"],
  raw: {}
};

export const bearishTeslaArticle: NewsArticle = {
  externalId: "news-2",
  source: "fixture",
  url: "https://example.com/tesla-cuts",
  title: "Tesla cuts guidance after weaker deliveries and margin pressure",
  summary: "The company faces downgrade risk as demand slows.",
  publishedAt: "2026-05-22T15:00:00.000Z",
  symbols: ["TSLA"],
  raw: {}
};

export const macroArticle: NewsArticle = {
  externalId: "news-3",
  source: "fixture",
  url: "https://example.com/higher-yields",
  title: "Stocks fall as higher yields and hotter inflation weigh on megacap tech",
  summary: "The risk-off move pressures SPY, QQQ, Apple, Microsoft, and Nvidia.",
  publishedAt: "2026-05-22T16:00:00.000Z",
  symbols: [],
  raw: {}
};
```

- [ ] **Step 2: Write sentiment tests**

Create `test/lib/domain/sentiment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bearishTeslaArticle, bullishNvidiaArticle, macroArticle } from "../../fixtures/articles";
import { scoreArticleSentiment } from "@/lib/domain/sentiment";

describe("scoreArticleSentiment", () => {
  it("scores bullish earnings language as positive", () => {
    const result = scoreArticleSentiment(bullishNvidiaArticle);
    expect(result.sentimentLabel).toBe("positive");
    expect(result.sentimentScore).toBeGreaterThan(0.3);
  });

  it("scores guidance cuts and downgrades as negative", () => {
    const result = scoreArticleSentiment(bearishTeslaArticle);
    expect(result.sentimentLabel).toBe("negative");
    expect(result.sentimentScore).toBeLessThan(-0.3);
  });

  it("scores higher yields and hot inflation as negative macro sentiment", () => {
    const result = scoreArticleSentiment(macroArticle);
    expect(result.sentimentLabel).toBe("negative");
    expect(result.sentimentScore).toBeLessThan(-0.2);
  });
});
```

- [ ] **Step 3: Write ticker attribution tests**

Create `test/lib/domain/ticker-attribution.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { macroArticle } from "../../fixtures/articles";
import { MONITORED_TICKERS } from "@/lib/config/tickers";
import { attributeArticleToTickers } from "@/lib/domain/ticker-attribution";

describe("attributeArticleToTickers", () => {
  it("uses explicit provider symbols when available", () => {
    const article = { ...macroArticle, symbols: ["NVDA", "TSLA", "XYZ"] };
    expect(attributeArticleToTickers(article, MONITORED_TICKERS).map((match) => match.symbol)).toEqual(["NVDA", "TSLA"]);
  });

  it("detects ETF and megacap names in macro news text", () => {
    const matches = attributeArticleToTickers(macroArticle, MONITORED_TICKERS);
    expect(matches.map((match) => match.symbol)).toEqual(expect.arrayContaining(["SPY", "QQQ", "AAPL", "MSFT", "NVDA"]));
  });
});
```

- [ ] **Step 4: Run failing tests**

Run:

```bash
npm test -- test/lib/domain/sentiment.test.ts test/lib/domain/ticker-attribution.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 5: Implement sentiment scoring**

Create `lib/domain/sentiment.ts`:

```ts
import type { NewsArticle, SentimentLabel } from "@/lib/domain/types";

const POSITIVE_TERMS = [
  "beats expectations",
  "raises guidance",
  "upgrade",
  "record revenue",
  "strong demand",
  "resilient",
  "accelerates",
  "outperform"
];

const NEGATIVE_TERMS = [
  "misses estimates",
  "cuts guidance",
  "downgrade",
  "investigation",
  "layoffs",
  "weaker deliveries",
  "margin pressure",
  "higher yields",
  "hotter inflation",
  "falls",
  "risk-off",
  "slows"
];

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function toLabel(score: number): SentimentLabel {
  if (score >= 0.2) return "positive";
  if (score <= -0.2) return "negative";
  return "neutral";
}

export function scoreArticleSentiment(article: NewsArticle): { sentimentScore: number; sentimentLabel: SentimentLabel } {
  const title = article.title.toLowerCase();
  const summary = (article.summary ?? "").toLowerCase();
  const titleScore = countMatches(title, POSITIVE_TERMS) * 0.35 - countMatches(title, NEGATIVE_TERMS) * 0.35;
  const summaryScore = countMatches(summary, POSITIVE_TERMS) * 0.18 - countMatches(summary, NEGATIVE_TERMS) * 0.18;
  const score = Math.max(-1, Math.min(1, titleScore + summaryScore));

  return {
    sentimentScore: Number(score.toFixed(3)),
    sentimentLabel: toLabel(score)
  };
}
```

- [ ] **Step 6: Implement ticker attribution**

Create `lib/domain/ticker-attribution.ts`:

```ts
import type { NewsArticle, TickerConfig } from "@/lib/domain/types";

const EXTRA_ALIASES: Record<string, string[]> = {
  SPY: ["s&p 500", "spdr s&p 500"],
  QQQ: ["nasdaq 100", "invesco qqq"],
  DIA: ["dow jones", "dow industrials"],
  IWM: ["russell 2000", "small caps"],
  GOOGL: ["google", "alphabet"],
  META: ["facebook", "meta platforms"],
  NVDA: ["nvidia"],
  TSLA: ["tesla"],
  AAPL: ["apple"],
  MSFT: ["microsoft"],
  AMD: ["advanced micro devices"],
  AMZN: ["amazon"],
  NFLX: ["netflix"],
  AVGO: ["broadcom"]
};

export interface TickerAttribution {
  symbol: string;
  relevanceScore: number;
}

export function attributeArticleToTickers(article: NewsArticle, tickers: TickerConfig[]): TickerAttribution[] {
  const allowedSymbols = new Set(tickers.map((ticker) => ticker.symbol));
  const explicitSymbols = article.symbols.filter((symbol) => allowedSymbols.has(symbol));
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  const detected = tickers
    .filter((ticker) => {
      const aliases = [ticker.symbol.toLowerCase(), ticker.name.toLowerCase(), ...(EXTRA_ALIASES[ticker.symbol] ?? [])];
      return aliases.some((alias) => text.includes(alias));
    })
    .map((ticker) => ticker.symbol);

  return Array.from(new Set([...explicitSymbols, ...detected])).map((symbol) => ({
    symbol,
    relevanceScore: explicitSymbols.includes(symbol) ? 1 : 0.7
  }));
}
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- test/lib/domain/sentiment.test.ts test/lib/domain/ticker-attribution.test.ts
npm run typecheck
git add lib/domain/sentiment.ts lib/domain/ticker-attribution.ts test/fixtures/articles.ts test/lib/domain/sentiment.test.ts test/lib/domain/ticker-attribution.test.ts
git commit -m "feat: add news sentiment attribution"
```

Expected: tests and typecheck pass.

---

### Task 4: Aggregation, Market Mood, And Alerts

**Files:**
- Create: `lib/domain/aggregation.ts`
- Create: `lib/domain/alerts.ts`
- Create: `test/fixtures/snapshots.ts`
- Create: `test/lib/domain/aggregation.test.ts`
- Create: `test/lib/domain/alerts.test.ts`

- [ ] **Step 1: Add snapshot fixtures**

Create `test/fixtures/snapshots.ts`:

```ts
import type { MarketSnapshot } from "@/lib/domain/types";

export const snapshotWindow = "2026-05-22T16:00:00.000Z";

export const marketSnapshots: MarketSnapshot[] = [
  { symbol: "SPY", capturedAt: snapshotWindow, price: 650, changePercent: 0.6, volume: 1000000, source: "fixture" },
  { symbol: "QQQ", capturedAt: snapshotWindow, price: 560, changePercent: 0.9, volume: 900000, source: "fixture" },
  { symbol: "NVDA", capturedAt: snapshotWindow, price: 140, changePercent: 2.4, volume: 800000, source: "fixture" },
  { symbol: "TSLA", capturedAt: snapshotWindow, price: 180, changePercent: -1.2, volume: 700000, source: "fixture" }
];
```

- [ ] **Step 2: Write aggregation tests**

Create `test/lib/domain/aggregation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { marketSnapshots, snapshotWindow } from "../../fixtures/snapshots";
import { aggregateTickerSentiment, calculateMarketMood } from "@/lib/domain/aggregation";
import type { ArticleTickerSentiment } from "@/lib/domain/types";

const articleSentiments: ArticleTickerSentiment[] = [
  { articleUrl: "a", symbol: "NVDA", relevanceScore: 1, sentimentScore: 0.7, sentimentLabel: "positive" },
  { articleUrl: "b", symbol: "NVDA", relevanceScore: 1, sentimentScore: 0.5, sentimentLabel: "positive" },
  { articleUrl: "c", symbol: "TSLA", relevanceScore: 1, sentimentScore: -0.6, sentimentLabel: "negative" },
  { articleUrl: "d", symbol: "SPY", relevanceScore: 1, sentimentScore: 0.2, sentimentLabel: "positive" },
  { articleUrl: "e", symbol: "QQQ", relevanceScore: 1, sentimentScore: 0.4, sentimentLabel: "positive" }
];

describe("aggregation", () => {
  it("aggregates hourly sentiment per ticker", () => {
    const rows = aggregateTickerSentiment({
      windowStart: snapshotWindow,
      tickers: ["NVDA", "TSLA"],
      sentiments: articleSentiments,
      snapshots: marketSnapshots,
      previous24hNewsAverage: new Map([["NVDA", 1], ["TSLA", 2]]),
      previous4hSentimentAverage: new Map([["NVDA", 0.2], ["TSLA", -0.2]])
    });

    expect(rows.find((row) => row.symbol === "NVDA")).toMatchObject({
      newsCount: 2,
      positiveCount: 2,
      mentionHeat: 2,
      sentimentVelocity: 0.4,
      priceChangePercent: 2.4
    });
  });

  it("calculates risk-on market mood from ETF and megacap strength", () => {
    const rows = aggregateTickerSentiment({
      windowStart: snapshotWindow,
      tickers: ["SPY", "QQQ", "NVDA", "TSLA"],
      sentiments: articleSentiments,
      snapshots: marketSnapshots,
      previous24hNewsAverage: new Map(),
      previous4hSentimentAverage: new Map()
    });
    const mood = calculateMarketMood(rows);
    expect(mood.moodLabel).toBe("risk_on");
    expect(mood.topPositive[0].symbol).toBe("NVDA");
  });
});
```

- [ ] **Step 3: Write alert tests**

Create `test/lib/domain/alerts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { detectAlerts } from "@/lib/domain/alerts";
import type { MarketHourlyMood, TickerHourlySentiment } from "@/lib/domain/types";

const windowStart = "2026-05-22T16:00:00.000Z";

const rows: TickerHourlySentiment[] = [
  {
    symbol: "TSLA",
    windowStart,
    newsCount: 8,
    avgSentiment: -0.7,
    positiveCount: 0,
    negativeCount: 7,
    neutralCount: 1,
    mentionHeat: 4,
    sentimentVelocity: -0.8,
    priceChangePercent: 2.1
  }
];

const mood: MarketHourlyMood = {
  windowStart,
  moodLabel: "risk_off",
  moodScore: -0.45,
  etfSentiment: -0.4,
  megaCapSentiment: -0.5,
  negativeBreadth: 0.7,
  positiveBreadth: 0.1,
  topPositive: [],
  topNegative: rows
};

describe("detectAlerts", () => {
  it("detects sentiment drops, volume spikes, divergence, and market risk-off", () => {
    const alerts = detectAlerts(rows, mood);
    expect(alerts.map((alert) => alert.alertType)).toEqual(
      expect.arrayContaining(["sentiment_drop", "news_volume_spike", "price_sentiment_divergence", "market_risk_off"])
    );
  });
});
```

- [ ] **Step 4: Run failing tests**

Run:

```bash
npm test -- test/lib/domain/aggregation.test.ts test/lib/domain/alerts.test.ts
```

Expected: FAIL because aggregation and alerts modules do not exist.

- [ ] **Step 5: Implement aggregation**

Create `lib/domain/aggregation.ts`:

```ts
import type { ArticleTickerSentiment, MarketHourlyMood, MarketSnapshot, TickerHourlySentiment } from "@/lib/domain/types";

const ETF_SYMBOLS = new Set(["SPY", "QQQ", "DIA", "IWM"]);
const MEGA_CAP_SYMBOLS = new Set(["NVDA", "AAPL", "MSFT", "META", "GOOGL", "AMZN", "AVGO"]);

interface AggregateInput {
  windowStart: string;
  tickers: string[];
  sentiments: ArticleTickerSentiment[];
  snapshots: MarketSnapshot[];
  previous24hNewsAverage: Map<string, number>;
  previous4hSentimentAverage: Map<string, number>;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function aggregateTickerSentiment(input: AggregateInput): TickerHourlySentiment[] {
  return input.tickers.map((symbol) => {
    const rows = input.sentiments.filter((item) => item.symbol === symbol);
    const scores = rows.map((row) => row.sentimentScore);
    const avgSentiment = average(scores);
    const historicalNewsAverage = input.previous24hNewsAverage.get(symbol) ?? 0;
    const previousSentiment = input.previous4hSentimentAverage.get(symbol) ?? 0;
    const snapshot = input.snapshots.find((item) => item.symbol === symbol);

    return {
      symbol,
      windowStart: input.windowStart,
      newsCount: rows.length,
      avgSentiment: avgSentiment === null ? null : Number(avgSentiment.toFixed(3)),
      positiveCount: rows.filter((row) => row.sentimentLabel === "positive").length,
      negativeCount: rows.filter((row) => row.sentimentLabel === "negative").length,
      neutralCount: rows.filter((row) => row.sentimentLabel === "neutral").length,
      mentionHeat: historicalNewsAverage > 0 ? Number((rows.length / historicalNewsAverage).toFixed(2)) : rows.length,
      sentimentVelocity: Number(((avgSentiment ?? 0) - previousSentiment).toFixed(3)),
      priceChangePercent: snapshot?.changePercent ?? null
    };
  });
}

export function calculateMarketMood(rows: TickerHourlySentiment[]): MarketHourlyMood {
  const etfRows = rows.filter((row) => ETF_SYMBOLS.has(row.symbol) && row.avgSentiment !== null);
  const megaCapRows = rows.filter((row) => MEGA_CAP_SYMBOLS.has(row.symbol) && row.avgSentiment !== null);
  const etfSentiment = average(etfRows.map((row) => row.avgSentiment ?? 0)) ?? 0;
  const megaCapSentiment = average(megaCapRows.map((row) => row.avgSentiment ?? 0)) ?? 0;
  const moodScore = Number((etfSentiment * 0.6 + megaCapSentiment * 0.4).toFixed(3));
  const positiveBreadth = rows.length === 0 ? 0 : rows.filter((row) => (row.avgSentiment ?? 0) >= 0.2).length / rows.length;
  const negativeBreadth = rows.length === 0 ? 0 : rows.filter((row) => (row.avgSentiment ?? 0) <= -0.2).length / rows.length;
  const topPositive = [...rows].sort((a, b) => (b.avgSentiment ?? -99) - (a.avgSentiment ?? -99)).slice(0, 5);
  const topNegative = [...rows].sort((a, b) => (a.avgSentiment ?? 99) - (b.avgSentiment ?? 99)).slice(0, 5);

  return {
    windowStart: rows[0]?.windowStart ?? new Date().toISOString(),
    moodLabel: moodScore >= 0.2 ? "risk_on" : moodScore <= -0.2 ? "risk_off" : "neutral",
    moodScore,
    etfSentiment: Number(etfSentiment.toFixed(3)),
    megaCapSentiment: Number(megaCapSentiment.toFixed(3)),
    negativeBreadth: Number(negativeBreadth.toFixed(3)),
    positiveBreadth: Number(positiveBreadth.toFixed(3)),
    topPositive,
    topNegative
  };
}
```

- [ ] **Step 6: Implement alert rules**

Create `lib/domain/alerts.ts`:

```ts
import type { AlertEvent, MarketHourlyMood, TickerHourlySentiment } from "@/lib/domain/types";

export function detectAlerts(rows: TickerHourlySentiment[], mood: MarketHourlyMood): AlertEvent[] {
  const alerts: AlertEvent[] = [];

  for (const row of rows) {
    if (row.sentimentVelocity <= -0.5) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "sentiment_drop",
        severity: "warning",
        message: `${row.symbol} sentiment deteriorated quickly in the current hourly window.`,
        metrics: { sentimentVelocity: row.sentimentVelocity, avgSentiment: row.avgSentiment }
      });
    }

    if (row.sentimentVelocity >= 0.5) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "sentiment_spike",
        severity: "info",
        message: `${row.symbol} sentiment improved quickly in the current hourly window.`,
        metrics: { sentimentVelocity: row.sentimentVelocity, avgSentiment: row.avgSentiment }
      });
    }

    if (row.mentionHeat >= 3 && row.newsCount >= 3) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "news_volume_spike",
        severity: "warning",
        message: `${row.symbol} news volume is unusually high versus its recent baseline.`,
        metrics: { mentionHeat: row.mentionHeat, newsCount: row.newsCount }
      });
    }

    if ((row.priceChangePercent ?? 0) > 1 && (row.avgSentiment ?? 0) < -0.4) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "price_sentiment_divergence",
        severity: "warning",
        message: `${row.symbol} price is rising while sentiment is negative.`,
        metrics: { priceChangePercent: row.priceChangePercent, avgSentiment: row.avgSentiment }
      });
    }
  }

  if (mood.moodLabel === "risk_off" && mood.negativeBreadth >= 0.5) {
    alerts.push({
      symbol: null,
      windowStart: mood.windowStart,
      alertType: "market_risk_off",
      severity: "critical",
      message: "ETF and mega-cap sentiment indicate a broad risk-off market mood.",
      metrics: { moodScore: mood.moodScore, negativeBreadth: mood.negativeBreadth }
    });
  }

  return alerts;
}
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- test/lib/domain/aggregation.test.ts test/lib/domain/alerts.test.ts
npm run typecheck
git add lib/domain/aggregation.ts lib/domain/alerts.ts test/fixtures/snapshots.ts test/lib/domain/aggregation.test.ts test/lib/domain/alerts.test.ts
git commit -m "feat: aggregate sentiment and alerts"
```

Expected: tests and typecheck pass.

---

### Task 5: Supabase Schema, RLS, And Scheduling SQL

**Files:**
- Create: `supabase/migrations/20260522000000_initial_schema.sql`
- Create: `supabase/sql/schedule_hourly_ingest.sql`
- Create: `README.md`

- [ ] **Step 1: Check Supabase CLI and current docs**

Run:

```bash
supabase --help
supabase migration --help
```

Expected: both commands print help. If the CLI is unavailable, install it using the official Supabase CLI documentation before continuing.

- [ ] **Step 2: Create the migration with the CLI**

Run:

```bash
supabase migration new initial_schema
```

Expected: the CLI creates a timestamped migration file. Rename that file to `supabase/migrations/20260522000000_initial_schema.sql` before the next step so this project keeps a stable migration path in git.

- [ ] **Step 3: Write the schema migration**

Put this SQL into `supabase/migrations/20260522000000_initial_schema.sql`:

```sql
create extension if not exists pgcrypto;

create table public.tickers (
  symbol text primary key,
  name text not null,
  asset_type text not null check (asset_type in ('etf', 'stock')),
  sector text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null references public.tickers(symbol),
  captured_at timestamptz not null,
  price numeric,
  change_percent numeric,
  volume numeric,
  source text not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (symbol, captured_at, source)
);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null,
  url text not null,
  title text not null,
  summary text,
  published_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (source, url)
);

create table public.article_tickers (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  symbol text not null references public.tickers(symbol),
  relevance_score numeric not null default 1,
  sentiment_score numeric,
  sentiment_label text check (sentiment_label in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default now(),
  primary key (article_id, symbol)
);

create table public.ticker_hourly_sentiment (
  id uuid primary key default gen_random_uuid(),
  symbol text not null references public.tickers(symbol),
  window_start timestamptz not null,
  news_count integer not null default 0,
  avg_sentiment numeric,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  neutral_count integer not null default 0,
  mention_heat numeric,
  sentiment_velocity numeric,
  price_change_percent numeric,
  created_at timestamptz not null default now(),
  unique (symbol, window_start)
);

create table public.market_hourly_mood (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null unique,
  mood_label text not null check (mood_label in ('risk_on', 'neutral', 'risk_off')),
  mood_score numeric,
  etf_sentiment numeric,
  mega_cap_sentiment numeric,
  negative_breadth numeric,
  positive_breadth numeric,
  top_positive jsonb,
  top_negative jsonb,
  created_at timestamptz not null default now()
);

create table public.topic_clusters (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null,
  label text not null,
  summary text,
  symbols text[],
  article_ids uuid[],
  score numeric,
  created_at timestamptz not null default now()
);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  symbol text references public.tickers(symbol),
  window_start timestamptz not null,
  alert_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  message text not null,
  metrics jsonb,
  created_at timestamptz not null default now()
);

create index market_snapshots_symbol_captured_idx on public.market_snapshots(symbol, captured_at desc);
create index news_articles_published_idx on public.news_articles(published_at desc);
create index article_tickers_symbol_idx on public.article_tickers(symbol);
create index ticker_hourly_sentiment_symbol_window_idx on public.ticker_hourly_sentiment(symbol, window_start desc);
create index alert_events_window_idx on public.alert_events(window_start desc);

alter table public.tickers enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.news_articles enable row level security;
alter table public.article_tickers enable row level security;
alter table public.ticker_hourly_sentiment enable row level security;
alter table public.market_hourly_mood enable row level security;
alter table public.topic_clusters enable row level security;
alter table public.alert_events enable row level security;

create policy "public can read tickers" on public.tickers for select using (true);
create policy "public can read hourly sentiment" on public.ticker_hourly_sentiment for select using (true);
create policy "public can read market mood" on public.market_hourly_mood for select using (true);
create policy "public can read topic clusters" on public.topic_clusters for select using (true);
create policy "public can read alert events" on public.alert_events for select using (true);

insert into public.tickers (symbol, name, asset_type, sector, is_active) values
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
on conflict (symbol) do update set
  name = excluded.name,
  asset_type = excluded.asset_type,
  sector = excluded.sector,
  is_active = excluded.is_active;
```

- [ ] **Step 4: Add Supabase Cron scheduling script**

Create `supabase/sql/schedule_hourly_ingest.sql`:

```sql
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.unschedule('hourly-market-sentiment-ingest')
where exists (
  select 1
  from cron.job
  where jobname = 'hourly-market-sentiment-ingest'
);

select cron.schedule(
  'hourly-market-sentiment-ingest',
  '5 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.app_base_url') || '/api/cron/hourly-ingest',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
    ),
    body := jsonb_build_object('source', 'supabase-cron')
  );
  $$
);
```

- [ ] **Step 5: Add README setup notes**

Create `README.md`:

````md
# US Market Sentiment Monitor

Hourly news-first sentiment dashboard for US market ETFs and mega-cap stocks.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Set Supabase, Finnhub, Marketaux, and `CRON_SECRET` values.
3. Install dependencies with `npm install`.
4. Run tests with `npm test`.
5. Run the app with `npm run dev`.

## Supabase

Create the initial migration with `supabase migration new initial_schema`, then apply the SQL from the implementation plan to the generated migration file.

For hourly scheduling, set these Postgres settings in the SQL session before running `supabase/sql/schedule_hourly_ingest.sql`:

```sql
alter database postgres set app.settings.app_base_url = :'app_base_url';
alter database postgres set app.settings.cron_secret = :'cron_secret';
```

The production `CRON_SECRET` must also be configured in Vercel.

## Verification

```bash
npm test
npm run typecheck
npm run build
```
````

- [ ] **Step 6: Verify schema locally**

Run:

```bash
supabase db reset
```

Expected: reset succeeds, all tables exist, seed tickers are inserted, and no RLS warnings are emitted by the reset output.

- [ ] **Step 7: Commit**

Run:

```bash
git add supabase README.md
git commit -m "feat: add supabase schema and cron plan"
```

---

### Task 6: Provider Clients And Hourly Pipeline

**Files:**
- Create: `lib/providers/market-data.ts`
- Create: `lib/providers/news.ts`
- Create: `lib/ingest/time.ts`
- Create: `lib/ingest/hourly-pipeline.ts`
- Create: `test/lib/ingest/hourly-pipeline.test.ts`

- [ ] **Step 1: Write pipeline test with mock providers and repository**

Create `test/lib/ingest/hourly-pipeline.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { bullishNvidiaArticle, bearishTeslaArticle } from "../../fixtures/articles";
import { marketSnapshots, snapshotWindow } from "../../fixtures/snapshots";
import { runHourlyIngest } from "@/lib/ingest/hourly-pipeline";

describe("runHourlyIngest", () => {
  it("fetches data, scores articles, aggregates rows, and writes repository records", async () => {
    const repository = {
      getActiveTickerSymbols: vi.fn().mockResolvedValue(["NVDA", "TSLA"]),
      getPrevious24hNewsAverages: vi.fn().mockResolvedValue(new Map([["NVDA", 1], ["TSLA", 1]])),
      getPrevious4hSentimentAverages: vi.fn().mockResolvedValue(new Map([["NVDA", 0.1], ["TSLA", -0.1]])),
      saveMarketSnapshots: vi.fn().mockResolvedValue(undefined),
      saveNewsArticles: vi.fn().mockResolvedValue(undefined),
      saveArticleTickerSentiments: vi.fn().mockResolvedValue(undefined),
      saveTickerHourlySentiment: vi.fn().mockResolvedValue(undefined),
      saveMarketMood: vi.fn().mockResolvedValue(undefined),
      saveAlerts: vi.fn().mockResolvedValue(undefined)
    };

    const result = await runHourlyIngest({
      windowStart: snapshotWindow,
      marketDataProvider: { fetchSnapshots: vi.fn().mockResolvedValue(marketSnapshots) },
      newsProvider: { fetchNews: vi.fn().mockResolvedValue([bullishNvidiaArticle, bearishTeslaArticle]) },
      repository
    });

    expect(result.snapshotCount).toBe(4);
    expect(result.articleCount).toBe(2);
    expect(result.tickerRows).toBe(2);
    expect(repository.saveTickerHourlySentiment).toHaveBeenCalledOnce();
    expect(repository.saveMarketMood).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- test/lib/ingest/hourly-pipeline.test.ts
```

Expected: FAIL because the pipeline module does not exist.

- [ ] **Step 3: Implement provider interfaces**

Create `lib/providers/market-data.ts`:

```ts
import type { MarketSnapshot } from "@/lib/domain/types";

export interface MarketDataProvider {
  fetchSnapshots(symbols: string[], capturedAt: string): Promise<MarketSnapshot[]>;
}

interface FinnhubQuote {
  c?: number;
  dp?: number;
}

export class FinnhubMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string) {}

  async fetchSnapshots(symbols: string[], capturedAt: string): Promise<MarketSnapshot[]> {
    const rows = await Promise.all(
      symbols.map(async (symbol) => {
        const url = new URL("https://finnhub.io/api/v1/quote");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("token", this.apiKey);
        const response = await fetch(url);
        if (!response.ok) {
          return { symbol, capturedAt, price: null, changePercent: null, volume: null, source: "finnhub", raw: { status: response.status } };
        }
        const quote = (await response.json()) as FinnhubQuote;
        return {
          symbol,
          capturedAt,
          price: quote.c ?? null,
          changePercent: quote.dp ?? null,
          volume: null,
          source: "finnhub",
          raw: quote
        };
      })
    );

    return rows;
  }
}
```

Create `lib/providers/news.ts`:

```ts
import type { NewsArticle } from "@/lib/domain/types";

export interface NewsProvider {
  fetchNews(symbols: string[], from: string, to: string): Promise<NewsArticle[]>;
}

interface MarketauxArticle {
  uuid?: string;
  url: string;
  title: string;
  description?: string;
  published_at?: string;
  source?: string;
  entities?: Array<{ symbol?: string }>;
}

export class MarketauxNewsProvider implements NewsProvider {
  constructor(private readonly apiKey: string) {}

  async fetchNews(symbols: string[], from: string, to: string): Promise<NewsArticle[]> {
    const url = new URL("https://api.marketaux.com/v1/news/all");
    url.searchParams.set("api_token", this.apiKey);
    url.searchParams.set("symbols", symbols.join(","));
    url.searchParams.set("filter_entities", "true");
    url.searchParams.set("published_after", from);
    url.searchParams.set("published_before", to);
    url.searchParams.set("language", "en");

    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: MarketauxArticle[] };
    return (payload.data ?? []).map((article) => ({
      externalId: article.uuid ?? null,
      source: article.source ?? "marketaux",
      url: article.url,
      title: article.title,
      summary: article.description ?? null,
      publishedAt: article.published_at ?? null,
      symbols: (article.entities ?? []).map((entity) => entity.symbol).filter((symbol): symbol is string => Boolean(symbol)),
      raw: article
    }));
  }
}
```

- [ ] **Step 4: Implement time helper and pipeline**

Create `lib/ingest/time.ts`:

```ts
export function floorToHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setUTCMinutes(0, 0, 0);
  return rounded;
}

export function previousHourWindow(now = new Date()): { windowStart: string; windowEnd: string } {
  const end = floorToHour(now);
  const start = new Date(end);
  start.setUTCHours(start.getUTCHours() - 1);
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
}
```

Create `lib/ingest/hourly-pipeline.ts`:

```ts
import { MONITORED_TICKERS } from "@/lib/config/tickers";
import { aggregateTickerSentiment, calculateMarketMood } from "@/lib/domain/aggregation";
import { detectAlerts } from "@/lib/domain/alerts";
import { scoreArticleSentiment } from "@/lib/domain/sentiment";
import { attributeArticleToTickers } from "@/lib/domain/ticker-attribution";
import type { ArticleTickerSentiment } from "@/lib/domain/types";
import type { MarketDataProvider } from "@/lib/providers/market-data";
import type { NewsProvider } from "@/lib/providers/news";

export interface HourlyRepository {
  getActiveTickerSymbols(): Promise<string[]>;
  getPrevious24hNewsAverages(symbols: string[], windowStart: string): Promise<Map<string, number>>;
  getPrevious4hSentimentAverages(symbols: string[], windowStart: string): Promise<Map<string, number>>;
  saveMarketSnapshots(rows: unknown[]): Promise<void>;
  saveNewsArticles(rows: unknown[]): Promise<void>;
  saveArticleTickerSentiments(rows: ArticleTickerSentiment[]): Promise<void>;
  saveTickerHourlySentiment(rows: unknown[]): Promise<void>;
  saveMarketMood(row: unknown): Promise<void>;
  saveAlerts(rows: unknown[]): Promise<void>;
}

interface RunHourlyIngestInput {
  windowStart: string;
  windowEnd?: string;
  marketDataProvider: MarketDataProvider;
  newsProvider: NewsProvider;
  repository: HourlyRepository;
}

export async function runHourlyIngest(input: RunHourlyIngestInput) {
  const symbols = await input.repository.getActiveTickerSymbols();
  const windowEnd = input.windowEnd ?? new Date(new Date(input.windowStart).getTime() + 60 * 60 * 1000).toISOString();
  const snapshots = await input.marketDataProvider.fetchSnapshots(symbols, input.windowStart);
  const articles = await input.newsProvider.fetchNews(symbols, input.windowStart, windowEnd);

  const articleTickerSentiments = articles.flatMap((article) => {
    const sentiment = scoreArticleSentiment(article);
    return attributeArticleToTickers(article, MONITORED_TICKERS).map((match) => ({
      articleUrl: article.url,
      symbol: match.symbol,
      relevanceScore: match.relevanceScore,
      sentimentScore: sentiment.sentimentScore,
      sentimentLabel: sentiment.sentimentLabel
    }));
  });

  const previous24hNewsAverage = await input.repository.getPrevious24hNewsAverages(symbols, input.windowStart);
  const previous4hSentimentAverage = await input.repository.getPrevious4hSentimentAverages(symbols, input.windowStart);
  const tickerRows = aggregateTickerSentiment({
    windowStart: input.windowStart,
    tickers: symbols,
    sentiments: articleTickerSentiments,
    snapshots,
    previous24hNewsAverage,
    previous4hSentimentAverage
  });
  const mood = calculateMarketMood(tickerRows);
  const alerts = detectAlerts(tickerRows, mood);

  await input.repository.saveMarketSnapshots(snapshots);
  await input.repository.saveNewsArticles(articles);
  await input.repository.saveArticleTickerSentiments(articleTickerSentiments);
  await input.repository.saveTickerHourlySentiment(tickerRows);
  await input.repository.saveMarketMood(mood);
  await input.repository.saveAlerts(alerts);

  return {
    snapshotCount: snapshots.length,
    articleCount: articles.length,
    tickerRows: tickerRows.length,
    alertCount: alerts.length,
    moodLabel: mood.moodLabel
  };
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- test/lib/ingest/hourly-pipeline.test.ts
npm run typecheck
git add lib/providers lib/ingest test/lib/ingest/hourly-pipeline.test.ts
git commit -m "feat: add hourly ingest pipeline"
```

Expected: tests and typecheck pass.

---

### Task 7: Supabase Repository And API Routes

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/repositories/dashboard-repository.ts`
- Create: `app/api/dashboard/latest/route.ts`
- Create: `app/api/tickers/[symbol]/history/route.ts`
- Create: `app/api/cron/hourly-ingest/route.ts`
- Create: `test/lib/repositories/dashboard-repository.test.ts`

- [ ] **Step 1: Write repository mapping test**

Create `test/lib/repositories/dashboard-repository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toTickerHourlyDbRow } from "@/lib/repositories/dashboard-repository";
import type { TickerHourlySentiment } from "@/lib/domain/types";

describe("dashboard repository mappers", () => {
  it("maps ticker sentiment to snake_case database row", () => {
    const row: TickerHourlySentiment = {
      symbol: "NVDA",
      windowStart: "2026-05-22T16:00:00.000Z",
      newsCount: 2,
      avgSentiment: 0.6,
      positiveCount: 2,
      negativeCount: 0,
      neutralCount: 0,
      mentionHeat: 2,
      sentimentVelocity: 0.4,
      priceChangePercent: 2.4
    };

    expect(toTickerHourlyDbRow(row)).toEqual({
      symbol: "NVDA",
      window_start: "2026-05-22T16:00:00.000Z",
      news_count: 2,
      avg_sentiment: 0.6,
      positive_count: 2,
      negative_count: 0,
      neutral_count: 0,
      mention_heat: 2,
      sentiment_velocity: 0.4,
      price_change_percent: 2.4
    });
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- test/lib/repositories/dashboard-repository.test.ts
```

Expected: FAIL because repository module does not exist.

- [ ] **Step 3: Add server Supabase clients**

Create `lib/supabase/server.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createPublicSupabaseClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
}

export function createServiceSupabaseClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
```

- [ ] **Step 4: Add repository mappers and methods**

Create `lib/repositories/dashboard-repository.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertEvent, MarketHourlyMood, MarketSnapshot, NewsArticle, TickerHourlySentiment } from "@/lib/domain/types";
import type { ArticleTickerSentiment } from "@/lib/domain/types";

export function toTickerHourlyDbRow(row: TickerHourlySentiment) {
  return {
    symbol: row.symbol,
    window_start: row.windowStart,
    news_count: row.newsCount,
    avg_sentiment: row.avgSentiment,
    positive_count: row.positiveCount,
    negative_count: row.negativeCount,
    neutral_count: row.neutralCount,
    mention_heat: row.mentionHeat,
    sentiment_velocity: row.sentimentVelocity,
    price_change_percent: row.priceChangePercent
  };
}

export class DashboardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getActiveTickerSymbols(): Promise<string[]> {
    const { data, error } = await this.supabase.from("tickers").select("symbol").eq("is_active", true).order("symbol");
    if (error) throw error;
    return (data ?? []).map((row) => row.symbol);
  }

  async getPrevious24hNewsAverages(symbols: string[]): Promise<Map<string, number>> {
    return new Map(symbols.map((symbol) => [symbol, 1]));
  }

  async getPrevious4hSentimentAverages(symbols: string[]): Promise<Map<string, number>> {
    return new Map(symbols.map((symbol) => [symbol, 0]));
  }

  async saveMarketSnapshots(rows: MarketSnapshot[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("market_snapshots").upsert(
      rows.map((row) => ({
        symbol: row.symbol,
        captured_at: row.capturedAt,
        price: row.price,
        change_percent: row.changePercent,
        volume: row.volume,
        source: row.source,
        raw: row.raw ?? null
      })),
      { onConflict: "symbol,captured_at,source" }
    );
    if (error) throw error;
  }

  async saveNewsArticles(rows: NewsArticle[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("news_articles").upsert(
      rows.map((row) => ({
        external_id: row.externalId,
        source: row.source,
        url: row.url,
        title: row.title,
        summary: row.summary,
        published_at: row.publishedAt,
        raw: row.raw ?? null
      })),
      { onConflict: "source,url" }
    );
    if (error) throw error;
  }

  async saveArticleTickerSentiments(rows: ArticleTickerSentiment[]): Promise<void> {
    if (rows.length === 0) return;
    const articleUrls = rows.map((row) => row.articleUrl);
    const { data: articles, error: articleError } = await this.supabase.from("news_articles").select("id,url").in("url", articleUrls);
    if (articleError) throw articleError;
    const idByUrl = new Map((articles ?? []).map((article) => [article.url, article.id]));
    const { error } = await this.supabase.from("article_tickers").upsert(
      rows
        .map((row) => ({
          article_id: idByUrl.get(row.articleUrl),
          symbol: row.symbol,
          relevance_score: row.relevanceScore,
          sentiment_score: row.sentimentScore,
          sentiment_label: row.sentimentLabel
        }))
        .filter((row) => row.article_id),
      { onConflict: "article_id,symbol" }
    );
    if (error) throw error;
  }

  async saveTickerHourlySentiment(rows: TickerHourlySentiment[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("ticker_hourly_sentiment").upsert(rows.map(toTickerHourlyDbRow), {
      onConflict: "symbol,window_start"
    });
    if (error) throw error;
  }

  async saveMarketMood(row: MarketHourlyMood): Promise<void> {
    const { error } = await this.supabase.from("market_hourly_mood").upsert(
      {
        window_start: row.windowStart,
        mood_label: row.moodLabel,
        mood_score: row.moodScore,
        etf_sentiment: row.etfSentiment,
        mega_cap_sentiment: row.megaCapSentiment,
        negative_breadth: row.negativeBreadth,
        positive_breadth: row.positiveBreadth,
        top_positive: row.topPositive,
        top_negative: row.topNegative
      },
      { onConflict: "window_start" }
    );
    if (error) throw error;
  }

  async saveAlerts(rows: AlertEvent[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("alert_events").insert(
      rows.map((row) => ({
        symbol: row.symbol,
        window_start: row.windowStart,
        alert_type: row.alertType,
        severity: row.severity,
        message: row.message,
        metrics: row.metrics
      }))
    );
    if (error) throw error;
  }
}
```

- [ ] **Step 5: Add API routes**

Create `app/api/dashboard/latest/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const [mood, tickers, alerts, topics] = await Promise.all([
    supabase.from("market_hourly_mood").select("*").order("window_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("ticker_hourly_sentiment").select("*").order("window_start", { ascending: false }).limit(50),
    supabase.from("alert_events").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("topic_clusters").select("*").order("score", { ascending: false }).limit(10)
  ]);

  if (mood.error || tickers.error || alerts.error || topics.error) {
    return NextResponse.json({ error: "Unable to load dashboard data" }, { status: 500 });
  }

  return NextResponse.json({
    mood: mood.data,
    tickers: tickers.data ?? [],
    alerts: alerts.data ?? [],
    topics: topics.data ?? []
  });
}
```

Create `app/api/tickers/[symbol]/history/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RANGE_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const range = request.nextUrl.searchParams.get("range") ?? "24h";
  const hours = RANGE_HOURS[range] ?? RANGE_HOURS["24h"];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("ticker_hourly_sentiment")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .gte("window_start", since)
    .order("window_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load ticker history" }, { status: 500 });
  }

  return NextResponse.json({ symbol: symbol.toUpperCase(), range, rows: data ?? [] });
}
```

Create `app/api/cron/hourly-ingest/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { DashboardRepository } from "@/lib/repositories/dashboard-repository";
import { runHourlyIngest } from "@/lib/ingest/hourly-pipeline";
import { previousHourWindow } from "@/lib/ingest/time";
import { FinnhubMarketDataProvider } from "@/lib/providers/market-data";
import { MarketauxNewsProvider } from "@/lib/providers/news";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  return Boolean(expected && header === `Bearer ${expected}`);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { windowStart, windowEnd } = previousHourWindow();
  const result = await runHourlyIngest({
    windowStart,
    windowEnd,
    marketDataProvider: new FinnhubMarketDataProvider(process.env.FINNHUB_API_KEY ?? ""),
    newsProvider: new MarketauxNewsProvider(process.env.MARKETAUX_API_KEY ?? ""),
    repository: new DashboardRepository(createServiceSupabaseClient())
  });

  return NextResponse.json({ ok: true, windowStart, windowEnd, result });
}
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- test/lib/repositories/dashboard-repository.test.ts
npm run typecheck
git add lib/supabase lib/repositories app/api test/lib/repositories/dashboard-repository.test.ts
git commit -m "feat: add supabase repository and api routes"
```

Expected: tests and typecheck pass.

---

### Task 8: Dashboard UI

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `components/dashboard/market-mood-panel.tsx`
- Create: `components/dashboard/ticker-table.tsx`
- Create: `components/dashboard/trend-chart.tsx`
- Create: `components/dashboard/topic-list.tsx`
- Create: `components/dashboard/alert-list.tsx`
- Create: `test/components/dashboard/market-mood-panel.test.tsx`

- [ ] **Step 1: Write component test**

Create `test/components/dashboard/market-mood-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketMoodPanel } from "@/components/dashboard/market-mood-panel";

describe("MarketMoodPanel", () => {
  it("shows mood label, score, and timestamp", () => {
    render(
      <MarketMoodPanel
        mood={{
          window_start: "2026-05-22T16:00:00.000Z",
          mood_label: "risk_on",
          mood_score: 0.42,
          etf_sentiment: 0.3,
          mega_cap_sentiment: 0.5,
          positive_breadth: 0.7,
          negative_breadth: 0.1
        }}
      />
    );

    expect(screen.getByText("Risk-on")).toBeInTheDocument();
    expect(screen.getByText("0.42")).toBeInTheDocument();
    expect(screen.getByText(/Last update/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- test/components/dashboard/market-mood-panel.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add dashboard components**

Create `components/dashboard/market-mood-panel.tsx`:

```tsx
interface MarketMoodPanelProps {
  mood: {
    window_start: string;
    mood_label: "risk_on" | "neutral" | "risk_off";
    mood_score: number | null;
    etf_sentiment: number | null;
    mega_cap_sentiment: number | null;
    positive_breadth: number | null;
    negative_breadth: number | null;
  } | null;
}

function labelForMood(value: string): string {
  if (value === "risk_on") return "Risk-on";
  if (value === "risk_off") return "Risk-off";
  return "Neutral";
}

export function MarketMoodPanel({ mood }: MarketMoodPanelProps) {
  if (!mood) {
    return <section className="panel">No market mood data yet.</section>;
  }

  return (
    <section className="panel mood-panel">
      <div>
        <p className="eyebrow">Market Mood</p>
        <h2>{labelForMood(mood.mood_label)}</h2>
        <p className="muted">Last update {new Date(mood.window_start).toLocaleString()}</p>
      </div>
      <div className="metric-row">
        <div><span>Score</span><strong>{mood.mood_score?.toFixed(2) ?? "0.00"}</strong></div>
        <div><span>ETF</span><strong>{mood.etf_sentiment?.toFixed(2) ?? "0.00"}</strong></div>
        <div><span>Mega-cap</span><strong>{mood.mega_cap_sentiment?.toFixed(2) ?? "0.00"}</strong></div>
      </div>
    </section>
  );
}
```

Create `components/dashboard/ticker-table.tsx`:

```tsx
interface TickerRow {
  symbol: string;
  price_change_percent: number | null;
  avg_sentiment: number | null;
  news_count: number;
  mention_heat: number | null;
  sentiment_velocity: number | null;
}

export function TickerTable({ rows }: { rows: TickerRow[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Ticker Sentiment</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Sentiment</th>
            <th>News</th>
            <th>Heat</th>
            <th>Velocity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <td>{row.symbol}</td>
              <td>{row.price_change_percent?.toFixed(2) ?? "0.00"}%</td>
              <td>{row.avg_sentiment?.toFixed(2) ?? "0.00"}</td>
              <td>{row.news_count}</td>
              <td>{row.mention_heat?.toFixed(2) ?? "0.00"}x</td>
              <td>{row.sentiment_velocity?.toFixed(2) ?? "0.00"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

Create `components/dashboard/trend-chart.tsx`:

```tsx
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendPoint {
  window_start: string;
  avg_sentiment: number | null;
}

export function TrendChart({ rows }: { rows: TrendPoint[] }) {
  return (
    <section className="panel chart-panel">
      <h2>Sentiment Trend</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows}>
          <XAxis dataKey="window_start" hide />
          <YAxis domain={[-1, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="avg_sentiment" stroke="#5fb3ff" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
```

Create `components/dashboard/topic-list.tsx`:

```tsx
interface Topic {
  id: string;
  label: string;
  summary: string | null;
  symbols: string[] | null;
  score: number | null;
}

export function TopicList({ topics }: { topics: Topic[] }) {
  return (
    <section className="panel">
      <h2>Topics</h2>
      <div className="stack">
        {topics.length === 0 ? <p className="muted">No topic clusters yet.</p> : null}
        {topics.map((topic) => (
          <article key={topic.id} className="list-item">
            <strong>{topic.label}</strong>
            <p>{topic.summary ?? "No summary available."}</p>
            <span>{(topic.symbols ?? []).join(", ")}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
```

Create `components/dashboard/alert-list.tsx`:

```tsx
interface AlertRow {
  id: string;
  symbol: string | null;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

export function AlertList({ alerts }: { alerts: AlertRow[] }) {
  return (
    <section className="panel">
      <h2>Alerts</h2>
      <div className="stack">
        {alerts.length === 0 ? <p className="muted">No alerts in the latest window.</p> : null}
        {alerts.map((alert) => (
          <article key={alert.id} className="list-item">
            <strong>{alert.symbol ?? "Market"} · {alert.severity}</strong>
            <p>{alert.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the dashboard page**

Replace `app/page.tsx` with:

```tsx
import { AlertList } from "@/components/dashboard/alert-list";
import { MarketMoodPanel } from "@/components/dashboard/market-mood-panel";
import { TickerTable } from "@/components/dashboard/ticker-table";
import { TopicList } from "@/components/dashboard/topic-list";
import { TrendChart } from "@/components/dashboard/trend-chart";

async function getDashboardData() {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/dashboard/latest`, { cache: "no-store" });
  if (!response.ok) {
    return { mood: null, tickers: [], alerts: [], topics: [] };
  }
  return response.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">US Market</p>
          <h1>Sentiment Monitor</h1>
        </div>
      </header>
      <MarketMoodPanel mood={data.mood} />
      <section className="dashboard-grid">
        <TickerTable rows={data.tickers} />
        <TrendChart rows={data.tickers.slice(0, 24)} />
        <TopicList topics={data.topics} />
        <AlertList alerts={data.alerts} />
      </section>
    </main>
  );
}
```

Append this to `app/globals.css`:

```css
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

h1,
h2,
p {
  margin-top: 0;
}

.eyebrow {
  color: var(--accent);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
  margin-bottom: 6px;
}

.muted {
  color: var(--muted);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}

.mood-panel {
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 20px;
  margin-bottom: 16px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-row div {
  background: var(--panel-soft);
  border-radius: 6px;
  padding: 12px;
}

.metric-row span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.metric-row strong {
  font-size: 22px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 10px 8px;
  text-align: left;
  white-space: nowrap;
}

th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.stack {
  display: grid;
  gap: 10px;
}

.list-item {
  background: var(--panel-soft);
  border-radius: 6px;
  padding: 12px;
}

.list-item p {
  color: var(--muted);
  margin-bottom: 6px;
}

@media (max-width: 900px) {
  .dashboard-shell {
    padding: 14px;
  }

  .mood-panel,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .metric-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify UI tests and build**

Run:

```bash
npm test -- test/components/dashboard/market-mood-panel.test.tsx
npm run typecheck
npm run build
```

Expected: test, typecheck, and production build pass.

- [ ] **Step 6: Browser verification**

Run:

```bash
npm run dev
```

Open `http://localhost:3000` in the Codex in-app browser. Verify the page renders at desktop and mobile widths, text does not overlap, the dark tool-style layout is readable, and empty states display when no Supabase data is present.

- [ ] **Step 7: Commit**

Run:

```bash
git add app components test/components/dashboard/market-mood-panel.test.tsx
git commit -m "feat: add market sentiment dashboard ui"
```

---

### Task 9: End-To-End Verification And Deployment Notes

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Add deployment verification notes**

Append this to `README.md`:

````md
## Deployment

Deploy the app to Vercel with these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
FINNHUB_API_KEY
MARKETAUX_API_KEY
CRON_SECRET
APP_BASE_URL
```

After deployment:

1. Apply the Supabase migration.
2. Set the database settings used by `supabase/sql/schedule_hourly_ingest.sql`.
3. Run the scheduling SQL in Supabase SQL editor or via `psql`.
4. Trigger `POST /api/cron/hourly-ingest` once with `Authorization: Bearer $CRON_SECRET`.
5. Confirm rows exist in `market_snapshots`, `news_articles`, `ticker_hourly_sentiment`, and `market_hourly_mood`.
6. Open the deployed dashboard and confirm the latest timestamp updates.
````

- [ ] **Step 2: Run full local verification**

Run:

```bash
npm test
npm run typecheck
npm run build
git status --short
```

Expected: tests pass, typecheck passes, build passes, and `git status --short` shows only README changes from this task.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md .env.example
git commit -m "docs: add deployment verification guide"
```

---

## Self-Review

Spec coverage:

- Monitored universe is covered in Task 2 and seeded in Task 5.
- Hourly quote and news ingestion is covered in Tasks 6 and 7.
- News attribution and sentiment scoring are covered in Task 3.
- Hourly ticker aggregation and market mood are covered in Task 4.
- Supabase schema, RLS, and read/write boundaries are covered in Task 5 and Task 7.
- Protected Cron endpoint and Supabase Cron scheduling are covered in Task 5 and Task 7.
- Dashboard cards, table, trend chart, topics, alerts, loading and empty behavior are covered in Task 8.
- Verification commands and deployment handoff are covered in Task 9.

Environment-specific secrets are represented as environment variable names or `psql` settings so secret values are never committed.

Execution should stop after each task if tests or typecheck fail, fix the failure in the same task scope, and commit only after verification passes.
