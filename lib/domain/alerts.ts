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
        metrics: { sentimentVelocity: row.sentimentVelocity, avgSentiment: row.avgSentiment },
      });
    }

    if (row.sentimentVelocity >= 0.5) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "sentiment_spike",
        severity: "info",
        message: `${row.symbol} sentiment improved quickly in the current hourly window.`,
        metrics: { sentimentVelocity: row.sentimentVelocity, avgSentiment: row.avgSentiment },
      });
    }

    if (row.mentionHeat >= 3 && row.newsCount >= 3) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "news_volume_spike",
        severity: "warning",
        message: `${row.symbol} news volume is unusually high versus its recent baseline.`,
        metrics: { mentionHeat: row.mentionHeat, newsCount: row.newsCount },
      });
    }

    if ((row.priceChangePercent ?? 0) > 1 && (row.avgSentiment ?? 0) < -0.4) {
      alerts.push({
        symbol: row.symbol,
        windowStart: row.windowStart,
        alertType: "price_sentiment_divergence",
        severity: "warning",
        message: `${row.symbol} price is rising while sentiment is negative.`,
        metrics: { priceChangePercent: row.priceChangePercent, avgSentiment: row.avgSentiment },
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
      metrics: { moodScore: mood.moodScore, negativeBreadth: mood.negativeBreadth },
    });
  }

  return alerts;
}
