import type { ArticleTickerSentiment, MarketHourlyMood, MarketSnapshot, TickerHourlySentiment } from "@/lib/domain/types";

export const ETF_SYMBOLS = new Set(["SPY", "QQQ", "DIA", "IWM"]);
export const MEGA_CAP_SYMBOLS = new Set(["NVDA", "AAPL", "MSFT", "META", "GOOGL", "AMZN", "AVGO"]);

interface AggregateInput {
  windowStart: string;
  tickers: string[];
  sentiments: ArticleTickerSentiment[];
  snapshots: MarketSnapshot[];
  previous24hNewsAverage: Map<string, number>;
  previous4hSentimentAverage: Map<string, number>;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function aggregateTickerSentiment(input: AggregateInput): TickerHourlySentiment[] {
  return input.tickers.map((symbol) => {
    const rows = input.sentiments.filter((item) => item.symbol === symbol);
    const avgSentiment = average(rows.map((row) => row.sentimentScore));
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
      priceChangePercent: snapshot?.changePercent ?? null,
    };
  });
}

export function calculateMarketMood(rows: TickerHourlySentiment[]): MarketHourlyMood {
  const etfRows = rows.filter((row) => ETF_SYMBOLS.has(row.symbol) && row.avgSentiment !== null);
  const megaCapRows = rows.filter((row) => MEGA_CAP_SYMBOLS.has(row.symbol) && row.avgSentiment !== null);
  const etfSentiment = average(etfRows.map((row) => row.avgSentiment ?? 0)) ?? 0;
  const megaCapSentiment = average(megaCapRows.map((row) => row.avgSentiment ?? 0)) ?? 0;
  const moodScore = Number((etfSentiment * 0.6 + megaCapSentiment * 0.4).toFixed(3));
  const positiveBreadth =
    rows.length === 0 ? 0 : rows.filter((row) => (row.avgSentiment ?? 0) >= 0.2).length / rows.length;
  const negativeBreadth =
    rows.length === 0 ? 0 : rows.filter((row) => (row.avgSentiment ?? 0) <= -0.2).length / rows.length;
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
    topNegative,
  };
}
