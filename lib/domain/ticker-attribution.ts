import type { NewsArticle, TickerConfig } from "@/lib/domain/types";

export const EXTRA_ALIASES: Record<string, string[]> = {
  SPY: ["S&P 500", "S&P500", "broad market"],
  QQQ: ["Nasdaq", "Nasdaq 100", "growth shares"],
  AAPL: ["Apple"],
  MSFT: ["Microsoft"],
  NVDA: ["Nvidia"],
  TSLA: ["Tesla"]
};

export interface TickerAttribution {
  symbol: string;
  relevanceScore: number;
  reason: "explicit" | "detected";
}

interface DetectedTicker {
  symbol: string;
  index: number;
}

function articleText(article: NewsArticle): string {
  return `${article.title} ${article.summary ?? ""}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findAliasIndex(text: string, alias: string): number {
  const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
  const match = pattern.exec(text);
  return match?.index ?? -1;
}

function aliasesForTicker(ticker: TickerConfig): string[] {
  return [ticker.symbol, ticker.name, ...(EXTRA_ALIASES[ticker.symbol] ?? [])];
}

export function attributeArticleToTickers(article: NewsArticle, tickers: TickerConfig[]): TickerAttribution[] {
  const allowedSymbols = new Set(tickers.filter((ticker) => ticker.isActive).map((ticker) => ticker.symbol));
  const matches: TickerAttribution[] = [];
  const matchedSymbols = new Set<string>();

  for (const symbol of article.symbols) {
    if (allowedSymbols.has(symbol) && !matchedSymbols.has(symbol)) {
      matches.push({ symbol, relevanceScore: 1, reason: "explicit" });
      matchedSymbols.add(symbol);
    }
  }

  const text = articleText(article);
  const detected = tickers.reduce<DetectedTicker[]>((results, ticker) => {
    if (!ticker.isActive || matchedSymbols.has(ticker.symbol)) {
      return results;
    }

    const index = aliasesForTicker(ticker).reduce((earliestIndex, alias) => {
      const aliasIndex = findAliasIndex(text, alias);

      if (aliasIndex === -1) {
        return earliestIndex;
      }

      return earliestIndex === -1 ? aliasIndex : Math.min(earliestIndex, aliasIndex);
    }, -1);

    if (index !== -1) {
      results.push({ symbol: ticker.symbol, index });
    }

    return results;
  }, []);

  for (const detectedTicker of detected.sort((left, right) => left.index - right.index)) {
    matches.push({ symbol: detectedTicker.symbol, relevanceScore: 0.7, reason: "detected" });
    matchedSymbols.add(detectedTicker.symbol);
  }

  return matches;
}
