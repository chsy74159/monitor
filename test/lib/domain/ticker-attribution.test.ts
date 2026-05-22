import { describe, expect, it } from "vitest";
import { MONITORED_TICKERS } from "@/lib/config/tickers";
import { attributeArticleToTickers } from "@/lib/domain/ticker-attribution";
import { macroArticle } from "@/test/fixtures/articles";
import type { NewsArticle } from "@/lib/domain/types";

describe("attributeArticleToTickers", () => {
  it("filters explicit provider symbols to the monitored universe", () => {
    const article: NewsArticle = {
      externalId: "provider-symbols",
      source: "fixture",
      url: "https://example.com/news/provider-symbols",
      title: "Chip stocks move after earnings",
      summary: "Nvidia and Tesla were active in premarket trading.",
      publishedAt: "2026-05-22T16:00:00.000Z",
      symbols: ["NVDA", "TSLA", "XYZ"]
    };

    expect(attributeArticleToTickers(article, MONITORED_TICKERS)).toEqual([
      { symbol: "NVDA", relevanceScore: 1, reason: "explicit" },
      { symbol: "TSLA", relevanceScore: 1, reason: "explicit" }
    ]);
  });

  it("detects macro text aliases for broad market and mega-cap tickers", () => {
    expect(attributeArticleToTickers(macroArticle, MONITORED_TICKERS)).toEqual([
      { symbol: "SPY", relevanceScore: 0.7, reason: "detected" },
      { symbol: "QQQ", relevanceScore: 0.7, reason: "detected" },
      { symbol: "AAPL", relevanceScore: 0.7, reason: "detected" },
      { symbol: "MSFT", relevanceScore: 0.7, reason: "detected" },
      { symbol: "NVDA", relevanceScore: 0.7, reason: "detected" }
    ]);
  });
});
