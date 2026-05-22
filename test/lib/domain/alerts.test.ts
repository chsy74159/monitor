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
    priceChangePercent: 2.1,
  },
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
  topNegative: rows,
};

describe("detectAlerts", () => {
  it("detects sentiment drops, volume spikes, divergence, and market risk-off", () => {
    const alerts = detectAlerts(rows, mood);
    expect(alerts.map((alert) => alert.alertType)).toEqual(
      expect.arrayContaining(["sentiment_drop", "news_volume_spike", "price_sentiment_divergence", "market_risk_off"]),
    );
  });
});
