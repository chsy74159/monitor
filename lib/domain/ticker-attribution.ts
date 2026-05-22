import type { NewsArticle, TickerConfig } from "@/lib/domain/types";

export const EXTRA_ALIASES: Record<string, string[]> = {
  SPY: ["s&p 500", "spdr s&p 500"],
  QQQ: ["nasdaq 100", "invesco qqq"],
  DIA: ["dow jones", "dow industrials"],
  IWM: ["russell 2000", "small caps"],
  GOOGL: ["google", "alphabet"],
  META: ["facebook", "meta platforms"],
  NVDA: ["nvidia"],
  TSLA: ["tesla"],
  AAPL: ["apple"],
  MSFT: ["microsoft"],
  AMD: ["advanced micro devices"],
  AMZN: ["amazon"],
  NFLX: ["netflix"],
  AVGO: ["broadcom"]
};

export interface TickerAttribution {
  symbol: string;
  relevanceScore: number;
}

function articleText(article: NewsArticle): string {
  return `${article.title} ${article.summary ?? ""}`.toLowerCase();
}

export function attributeArticleToTickers(article: NewsArticle, tickers: TickerConfig[]): TickerAttribution[] {
  const allowedSymbols = new Set(tickers.map((ticker) => ticker.symbol));
  const explicitSymbols = article.symbols.filter((symbol) => allowedSymbols.has(symbol));
  const text = articleText(article);
  const detected = tickers
    .filter((ticker) => {
      const aliases = [ticker.symbol.toLowerCase(), ticker.name.toLowerCase(), ...(EXTRA_ALIASES[ticker.symbol] ?? [])];
      return aliases.some((alias) => text.includes(alias));
    })
    .map((ticker) => ticker.symbol);

  return Array.from(new Set([...explicitSymbols, ...detected])).map((symbol) => ({
    symbol,
    relevanceScore: explicitSymbols.includes(symbol) ? 1 : 0.7
  }));
}
