import type { NewsArticle } from "@/lib/domain/types";

export const bullishNvidiaArticle: NewsArticle = {
  externalId: "bullish-nvidia-earnings",
  source: "fixture",
  url: "https://example.com/news/bullish-nvidia-earnings",
  title: "Nvidia shares rally after strong earnings beat expectations",
  summary:
    "Nvidia raised guidance after robust demand drove accelerating revenue growth and expanding margins.",
  publishedAt: "2026-05-22T13:30:00.000Z",
  symbols: ["NVDA"]
};

export const bearishTeslaArticle: NewsArticle = {
  externalId: "bearish-tesla-guidance",
  source: "fixture",
  url: "https://example.com/news/bearish-tesla-guidance",
  title: "Tesla slides as analysts downgrade shares after guidance cut",
  summary:
    "Tesla warned of weaker demand, missed margin expectations, and lowered its outlook after delivery concerns.",
  publishedAt: "2026-05-22T14:00:00.000Z",
  symbols: ["TSLA"]
};

export const macroArticle: NewsArticle = {
  externalId: "macro-hot-inflation",
  source: "fixture",
  url: "https://example.com/news/macro-hot-inflation",
  title: "Stocks fall as hot inflation pushes Treasury yields higher",
  summary:
    "The S&P 500 and Nasdaq retreated as Apple, Microsoft, and Nvidia weighed on the market after higher yields renewed pressure on growth shares.",
  publishedAt: "2026-05-22T15:00:00.000Z",
  symbols: []
};
