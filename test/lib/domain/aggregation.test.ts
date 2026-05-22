import { describe, expect, it } from "vitest";
import { marketSnapshots, snapshotWindow } from "../../fixtures/snapshots";
import { aggregateTickerSentiment, calculateMarketMood } from "@/lib/domain/aggregation";
import type { ArticleTickerSentiment } from "@/lib/domain/types";

const articleSentiments: ArticleTickerSentiment[] = [
  { articleUrl: "a", symbol: "NVDA", relevanceScore: 1, sentimentScore: 0.7, sentimentLabel: "positive" },
  { articleUrl: "b", symbol: "NVDA", relevanceScore: 1, sentimentScore: 0.5, sentimentLabel: "positive" },
  { articleUrl: "c", symbol: "TSLA", relevanceScore: 1, sentimentScore: -0.6, sentimentLabel: "negative" },
  { articleUrl: "d", symbol: "SPY", relevanceScore: 1, sentimentScore: 0.2, sentimentLabel: "positive" },
  { articleUrl: "e", symbol: "QQQ", relevanceScore: 1, sentimentScore: 0.4, sentimentLabel: "positive" },
];

describe("aggregation", () => {
  it("aggregates hourly sentiment per ticker", () => {
    const rows = aggregateTickerSentiment({
      windowStart: snapshotWindow,
      tickers: ["NVDA", "TSLA"],
      sentiments: articleSentiments,
      snapshots: marketSnapshots,
      previous24hNewsAverage: new Map([
        ["NVDA", 1],
        ["TSLA", 2],
      ]),
      previous4hSentimentAverage: new Map([
        ["NVDA", 0.2],
        ["TSLA", -0.2],
      ]),
    });

    expect(rows.find((row) => row.symbol === "NVDA")).toMatchObject({
      newsCount: 2,
      positiveCount: 2,
      mentionHeat: 2,
      sentimentVelocity: 0.4,
      priceChangePercent: 2.4,
    });
  });

  it("calculates risk-on market mood from ETF and megacap strength", () => {
    const rows = aggregateTickerSentiment({
      windowStart: snapshotWindow,
      tickers: ["SPY", "QQQ", "NVDA", "TSLA", "AMD"],
      sentiments: articleSentiments,
      snapshots: marketSnapshots,
      previous24hNewsAverage: new Map(),
      previous4hSentimentAverage: new Map(),
    });
    const mood = calculateMarketMood(rows);
    expect(mood.moodLabel).toBe("risk_on");
    expect(mood.topPositive[0].symbol).toBe("NVDA");
    expect(mood.topPositive.map((row) => row.symbol)).not.toContain("AMD");
    expect(mood.topNegative.map((row) => row.symbol)).not.toContain("AMD");
  });

  it("does not create sentiment velocity when the current hour has no scored news", () => {
    const [row] = aggregateTickerSentiment({
      windowStart: snapshotWindow,
      tickers: ["AMD"],
      sentiments: [],
      snapshots: [],
      previous24hNewsAverage: new Map([["AMD", 2]]),
      previous4hSentimentAverage: new Map([["AMD", 0.8]]),
    });

    expect(row).toMatchObject({
      symbol: "AMD",
      newsCount: 0,
      avgSentiment: null,
      sentimentVelocity: 0,
    });
  });
});
