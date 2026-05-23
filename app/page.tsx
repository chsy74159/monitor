import { AlertList } from "@/components/dashboard/alert-list";
import { MarketMoodPanel } from "@/components/dashboard/market-mood-panel";
import { TickerTable } from "@/components/dashboard/ticker-table";
import { TopicList } from "@/components/dashboard/topic-list";
import { TrendChart } from "@/components/dashboard/trend-chart";

export const dynamic = "force-dynamic";

interface DashboardData {
  mood: {
    window_start: string;
    mood_label: "risk_on" | "neutral" | "risk_off";
    mood_score: number | null;
    etf_sentiment: number | null;
    mega_cap_sentiment: number | null;
    positive_breadth: number | null;
    negative_breadth: number | null;
  } | null;
  tickers: Array<{
    symbol: string;
    window_start: string;
    price_change_percent: number | null;
    avg_sentiment: number | null;
    news_count: number;
    mention_heat: number | null;
    sentiment_velocity: number | null;
  }>;
  alerts: Array<{
    id: string;
    symbol: string | null;
    alert_type: string;
    severity: string;
    message: string;
    created_at: string;
  }>;
  topics: Array<{
    id: string;
    label: string;
    summary: string | null;
    symbols: string[] | null;
    score: number | null;
  }>;
}

const emptyDashboardData: DashboardData = {
  mood: null,
  tickers: [],
  alerts: [],
  topics: []
};

async function getDashboardData(): Promise<DashboardData> {
  try {
    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/dashboard/latest`, { cache: "no-store" });

    if (!response.ok) {
      return emptyDashboardData;
    }

    return (await response.json()) as DashboardData;
  } catch {
    return emptyDashboardData;
  }
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
        <div className="status-block">
          <span>Hourly</span>
          <strong>{data.mood?.window_start ? new Date(data.mood.window_start).toLocaleTimeString() : "Pending"}</strong>
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
