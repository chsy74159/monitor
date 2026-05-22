export type AssetType = "etf" | "stock";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type MarketMoodLabel = "risk_on" | "neutral" | "risk_off";
export type AlertSeverity = "info" | "warning" | "critical";

export interface TickerConfig {
  symbol: string;
  name: string;
  assetType: AssetType;
  sector: string;
  isActive: boolean;
}

export interface MarketSnapshot {
  symbol: string;
  capturedAt: string;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  source: string;
  raw?: unknown;
}

export interface NewsArticle {
  externalId: string | null;
  source: string;
  url: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  symbols: string[];
  raw?: unknown;
}

export interface ArticleTickerSentiment {
  articleUrl: string;
  symbol: string;
  relevanceScore: number;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
}

export interface TickerHourlySentiment {
  symbol: string;
  windowStart: string;
  newsCount: number;
  avgSentiment: number | null;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mentionHeat: number;
  sentimentVelocity: number;
  priceChangePercent: number | null;
}

export interface MarketHourlyMood {
  windowStart: string;
  moodLabel: MarketMoodLabel;
  moodScore: number;
  etfSentiment: number;
  megaCapSentiment: number;
  negativeBreadth: number;
  positiveBreadth: number;
  topPositive: TickerHourlySentiment[];
  topNegative: TickerHourlySentiment[];
}

export interface TopicCluster {
  id: string;
  windowStart: string;
  label: string;
  summary: string;
  symbols: string[];
  score: number;
}

export interface AlertEvent {
  symbol: string | null;
  windowStart: string;
  alertType:
    | "sentiment_drop"
    | "sentiment_spike"
    | "news_volume_spike"
    | "market_risk_off"
    | "price_sentiment_divergence";
  severity: AlertSeverity;
  message: string;
  metrics: Record<string, unknown>;
}
