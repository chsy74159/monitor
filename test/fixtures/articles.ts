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
