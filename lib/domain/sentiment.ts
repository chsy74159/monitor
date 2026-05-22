import type { NewsArticle, SentimentLabel } from "@/lib/domain/types";

export const POSITIVE_TERMS = [
  "accelerating",
  "beat",
  "expanding",
  "growth",
  "raised guidance",
  "rally",
  "robust",
  "strong",
  "upgraded"
];

export const NEGATIVE_TERMS = [
  "cut",
  "downgrade",
  "fall",
  "higher yields",
  "hot inflation",
  "lowered",
  "missed",
  "pressure",
  "retreated",
  "slides",
  "weaker",
  "weighed",
  "warned"
];

function articleText(article: NewsArticle): string {
  return `${article.title} ${article.summary ?? ""}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

export function toLabel(score: number): SentimentLabel {
  if (score >= 0.2) {
    return "positive";
  }

  if (score <= -0.2) {
    return "negative";
  }

  return "neutral";
}

export function scoreArticleSentiment(article: NewsArticle): { score: number; label: SentimentLabel } {
  const text = articleText(article);
  const positiveMatches = countMatches(text, POSITIVE_TERMS);
  const negativeMatches = countMatches(text, NEGATIVE_TERMS);
  const totalMatches = positiveMatches + negativeMatches;
  const rawScore = totalMatches === 0 ? 0 : (positiveMatches - negativeMatches) / totalMatches;
  const score = Math.round(Math.max(-1, Math.min(1, rawScore)) * 1000) / 1000;

  return {
    score,
    label: toLabel(score)
  };
}
