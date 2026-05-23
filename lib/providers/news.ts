import type { NewsArticle } from "@/lib/domain/types";

export interface NewsProvider {
  fetchNews(symbols: string[], from: string, to: string): Promise<NewsArticle[]>;
}

interface MarketauxArticle {
  uuid?: string;
  url: string;
  title: string;
  description?: string;
  published_at?: string;
  source?: string;
  entities?: Array<{ symbol?: string }>;
}

export class MarketauxNewsProvider implements NewsProvider {
  constructor(private readonly apiKey: string) {}

  async fetchNews(symbols: string[], from: string, to: string): Promise<NewsArticle[]> {
    const url = new URL("https://api.marketaux.com/v1/news/all");
    url.searchParams.set("api_token", this.apiKey);
    url.searchParams.set("symbols", symbols.join(","));
    url.searchParams.set("filter_entities", "true");
    url.searchParams.set("published_after", from);
    url.searchParams.set("published_before", to);
    url.searchParams.set("language", "en");

    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: MarketauxArticle[] };

    return (payload.data ?? []).map((article) => ({
      externalId: article.uuid ?? null,
      source: article.source ?? "marketaux",
      url: article.url,
      title: article.title,
      summary: article.description ?? null,
      publishedAt: article.published_at ?? null,
      symbols: (article.entities ?? [])
        .map((entity) => entity.symbol)
        .filter((symbol): symbol is string => Boolean(symbol)),
      raw: article
    }));
  }
}
