import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlertEvent,
  ArticleTickerSentiment,
  MarketHourlyMood,
  MarketSnapshot,
  NewsArticle,
  TickerHourlySentiment
} from "@/lib/domain/types";

export function toTickerHourlyDbRow(row: TickerHourlySentiment) {
  return {
    symbol: row.symbol,
    window_start: row.windowStart,
    news_count: row.newsCount,
    avg_sentiment: row.avgSentiment,
    positive_count: row.positiveCount,
    negative_count: row.negativeCount,
    neutral_count: row.neutralCount,
    mention_heat: row.mentionHeat,
    sentiment_velocity: row.sentimentVelocity,
    price_change_percent: row.priceChangePercent
  };
}

function toMarketSnapshotDbRow(row: MarketSnapshot) {
  return {
    symbol: row.symbol,
    captured_at: row.capturedAt,
    price: row.price,
    change_percent: row.changePercent,
    volume: row.volume,
    source: row.source,
    raw: row.raw ?? {}
  };
}

function toNewsArticleDbRow(row: NewsArticle) {
  return {
    external_id: row.externalId,
    source: row.source,
    url: row.url,
    title: row.title,
    summary: row.summary,
    published_at: row.publishedAt,
    raw: row.raw ?? {}
  };
}

function toMarketMoodDbRow(row: MarketHourlyMood) {
  return {
    window_start: row.windowStart,
    mood_label: row.moodLabel,
    mood_score: row.moodScore,
    etf_sentiment: row.etfSentiment,
    mega_cap_sentiment: row.megaCapSentiment,
    negative_breadth: row.negativeBreadth,
    positive_breadth: row.positiveBreadth,
    top_positive: row.topPositive,
    top_negative: row.topNegative
  };
}

function toAlertDbRow(row: AlertEvent) {
  return {
    symbol: row.symbol,
    window_start: row.windowStart,
    alert_type: row.alertType,
    severity: row.severity,
    message: row.message,
    metrics: row.metrics
  };
}

export class DashboardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getActiveTickerSymbols(): Promise<string[]> {
    const { data, error } = await this.supabase.from("tickers").select("symbol").eq("is_active", true).order("symbol");

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => row.symbol as string);
  }

  async getPrevious24hNewsAverages(symbols: string[]): Promise<Map<string, number>> {
    return new Map(symbols.map((symbol) => [symbol, 1]));
  }

  async getPrevious4hSentimentAverages(symbols: string[]): Promise<Map<string, number>> {
    return new Map(symbols.map((symbol) => [symbol, 0]));
  }

  async saveMarketSnapshots(rows: MarketSnapshot[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from("market_snapshots")
      .upsert(rows.map(toMarketSnapshotDbRow), { onConflict: "symbol,captured_at,source" });

    if (error) {
      throw error;
    }
  }

  async saveNewsArticles(rows: NewsArticle[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from("news_articles")
      .upsert(rows.map(toNewsArticleDbRow), { onConflict: "source,url" });

    if (error) {
      throw error;
    }
  }

  async saveArticleTickerSentiments(rows: ArticleTickerSentiment[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const articleUrls = [...new Set(rows.map((row) => row.articleUrl))];
    const { data: articles, error: articleError } = await this.supabase
      .from("news_articles")
      .select("id,url")
      .in("url", articleUrls);

    if (articleError) {
      throw articleError;
    }

    const idByUrl = new Map((articles ?? []).map((article) => [article.url as string, article.id as string]));
    const dbRows = rows.flatMap((row) => {
      const articleId = idByUrl.get(row.articleUrl);

      if (!articleId) {
        return [];
      }

      return [
        {
          article_id: articleId,
          symbol: row.symbol,
          relevance_score: row.relevanceScore,
          sentiment_score: row.sentimentScore,
          sentiment_label: row.sentimentLabel
        }
      ];
    });

    if (dbRows.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("article_tickers").upsert(dbRows, {
      onConflict: "article_id,symbol"
    });

    if (error) {
      throw error;
    }
  }

  async saveTickerHourlySentiment(rows: TickerHourlySentiment[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("ticker_hourly_sentiment").upsert(rows.map(toTickerHourlyDbRow), {
      onConflict: "symbol,window_start"
    });

    if (error) {
      throw error;
    }
  }

  async saveMarketMood(row: MarketHourlyMood): Promise<void> {
    const { error } = await this.supabase.from("market_hourly_mood").upsert(toMarketMoodDbRow(row), {
      onConflict: "window_start"
    });

    if (error) {
      throw error;
    }
  }

  async saveAlerts(rows: AlertEvent[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("alert_events").insert(rows.map(toAlertDbRow));

    if (error) {
      throw error;
    }
  }
}
