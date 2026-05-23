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
