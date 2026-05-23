import { MONITORED_TICKERS } from "@/lib/config/tickers";
import { aggregateTickerSentiment, calculateMarketMood } from "@/lib/domain/aggregation";
import { detectAlerts } from "@/lib/domain/alerts";
import { scoreArticleSentiment } from "@/lib/domain/sentiment";
import { attributeArticleToTickers } from "@/lib/domain/ticker-attribution";
import type {
  AlertEvent,
  ArticleTickerSentiment,
  MarketHourlyMood,
  MarketSnapshot,
  NewsArticle,
  TickerHourlySentiment
} from "@/lib/domain/types";
import type { MarketDataProvider } from "@/lib/providers/market-data";
import type { NewsProvider } from "@/lib/providers/news";

export interface HourlyRepository {
  getActiveTickerSymbols(): Promise<string[]>;
  getPrevious24hNewsAverages(symbols: string[], windowStart: string): Promise<Map<string, number>>;
  getPrevious4hSentimentAverages(symbols: string[], windowStart: string): Promise<Map<string, number>>;
  saveMarketSnapshots(rows: MarketSnapshot[]): Promise<void>;
  saveNewsArticles(rows: NewsArticle[]): Promise<void>;
  saveArticleTickerSentiments(rows: ArticleTickerSentiment[]): Promise<void>;
  saveTickerHourlySentiment(rows: TickerHourlySentiment[]): Promise<void>;
  saveMarketMood(row: MarketHourlyMood): Promise<void>;
  saveAlerts(rows: AlertEvent[]): Promise<void>;
}

interface RunHourlyIngestInput {
  windowStart: string;
  windowEnd?: string;
  marketDataProvider: MarketDataProvider;
  newsProvider: NewsProvider;
  repository: HourlyRepository;
}

export async function runHourlyIngest(input: RunHourlyIngestInput) {
  const symbols = await input.repository.getActiveTickerSymbols();
  const activeTickers = MONITORED_TICKERS.filter((ticker) => symbols.includes(ticker.symbol));
  const windowEnd = input.windowEnd ?? new Date(new Date(input.windowStart).getTime() + 60 * 60 * 1000).toISOString();
  const snapshots = await input.marketDataProvider.fetchSnapshots(symbols, input.windowStart);
  const articles = await input.newsProvider.fetchNews(symbols, input.windowStart, windowEnd);

  const articleTickerSentiments = articles.flatMap((article) => {
    const sentiment = scoreArticleSentiment(article);

    return attributeArticleToTickers(article, activeTickers).map((match) => ({
      articleUrl: article.url,
      symbol: match.symbol,
      relevanceScore: match.relevanceScore,
      sentimentScore: sentiment.sentimentScore,
      sentimentLabel: sentiment.sentimentLabel
    }));
  });

  const previous24hNewsAverage = await input.repository.getPrevious24hNewsAverages(symbols, input.windowStart);
  const previous4hSentimentAverage = await input.repository.getPrevious4hSentimentAverages(symbols, input.windowStart);
  const tickerRows = aggregateTickerSentiment({
    windowStart: input.windowStart,
    tickers: symbols,
    sentiments: articleTickerSentiments,
    snapshots,
    previous24hNewsAverage,
    previous4hSentimentAverage
  });
  const mood = calculateMarketMood(tickerRows);
  const alerts = detectAlerts(tickerRows, mood);

  await input.repository.saveMarketSnapshots(snapshots);
  await input.repository.saveNewsArticles(articles);
  await input.repository.saveArticleTickerSentiments(articleTickerSentiments);
  await input.repository.saveTickerHourlySentiment(tickerRows);
  await input.repository.saveMarketMood(mood);
  await input.repository.saveAlerts(alerts);

  return {
    snapshotCount: snapshots.length,
    articleCount: articles.length,
    tickerRows: tickerRows.length,
    alertCount: alerts.length,
    moodLabel: mood.moodLabel
  };
}
