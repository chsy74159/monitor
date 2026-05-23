import { describe, expect, it, vi } from "vitest";
import { bearishTeslaArticle, bullishNvidiaArticle, macroArticle } from "../../fixtures/articles";
import { marketSnapshots, snapshotWindow } from "../../fixtures/snapshots";
import { runHourlyIngest } from "@/lib/ingest/hourly-pipeline";

describe("runHourlyIngest", () => {
  it("fetches data, scores articles, aggregates rows, and writes repository records", async () => {
    const repository = {
      getActiveTickerSymbols: vi.fn().mockResolvedValue(["NVDA", "TSLA"]),
      getPrevious24hNewsAverages: vi.fn().mockResolvedValue(
        new Map([
          ["NVDA", 1],
          ["TSLA", 1]
        ])
      ),
      getPrevious4hSentimentAverages: vi.fn().mockResolvedValue(
        new Map([
          ["NVDA", 0.1],
          ["TSLA", -0.1]
        ])
      ),
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

  it("only saves article sentiment rows for active tickers", async () => {
    const repository = {
      getActiveTickerSymbols: vi.fn().mockResolvedValue(["NVDA"]),
      getPrevious24hNewsAverages: vi.fn().mockResolvedValue(new Map([["NVDA", 1]])),
      getPrevious4hSentimentAverages: vi.fn().mockResolvedValue(new Map([["NVDA", 0]])),
      saveMarketSnapshots: vi.fn().mockResolvedValue(undefined),
      saveNewsArticles: vi.fn().mockResolvedValue(undefined),
      saveArticleTickerSentiments: vi.fn().mockResolvedValue(undefined),
      saveTickerHourlySentiment: vi.fn().mockResolvedValue(undefined),
      saveMarketMood: vi.fn().mockResolvedValue(undefined),
      saveAlerts: vi.fn().mockResolvedValue(undefined)
    };

    await runHourlyIngest({
      windowStart: snapshotWindow,
      marketDataProvider: { fetchSnapshots: vi.fn().mockResolvedValue(marketSnapshots) },
      newsProvider: { fetchNews: vi.fn().mockResolvedValue([macroArticle]) },
      repository
    });

    expect(repository.saveArticleTickerSentiments).toHaveBeenCalledWith([
      expect.objectContaining({ symbol: "NVDA" })
    ]);
  });
});
