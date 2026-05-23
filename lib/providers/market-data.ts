import type { MarketSnapshot } from "@/lib/domain/types";

export interface MarketDataProvider {
  fetchSnapshots(symbols: string[], capturedAt: string): Promise<MarketSnapshot[]>;
}

interface FinnhubQuote {
  c?: number;
  dp?: number;
}

export class FinnhubMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string) {}

  async fetchSnapshots(symbols: string[], capturedAt: string): Promise<MarketSnapshot[]> {
    return Promise.all(
      symbols.map(async (symbol) => {
        const url = new URL("https://finnhub.io/api/v1/quote");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("token", this.apiKey);

        const response = await fetch(url);
        if (!response.ok) {
          return {
            symbol,
            capturedAt,
            price: null,
            changePercent: null,
            volume: null,
            source: "finnhub",
            raw: { status: response.status }
          };
        }

        const quote = (await response.json()) as FinnhubQuote;

        return {
          symbol,
          capturedAt,
          price: quote.c ?? null,
          changePercent: quote.dp ?? null,
          volume: null,
          source: "finnhub",
          raw: quote
        };
      })
    );
  }
}
