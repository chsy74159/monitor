import type { NewsArticle, SentimentLabel } from "@/lib/domain/types";

export const POSITIVE_TERMS = [
  "beats expectations",
  "raises guidance",
  "upgrade",
  "record revenue",
  "strong demand",
  "resilient",
  "accelerates",
  "outperform"
];

export const NEGATIVE_TERMS = [
  "misses estimates",
  "cuts guidance",
  "downgrade",
  "investigation",
  "layoffs",
  "weaker deliveries",
  "margin pressure",
  "higher yields",
  "hotter inflation",
  "falls",
  "risk-off",
  "slows"
];

export function countMatches(text: string, terms: string[]): number {
  return terms.filter((term) => text.includes(term)).length;
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

function clampScore(score: number): number {
  return Math.max(-1, Math.min(1, score));
}

export function scoreArticleSentiment(article: NewsArticle): {
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
} {
  const title = article.title.toLowerCase();
  const summary = (article.summary ?? "").toLowerCase();
  const titleScore = countMatches(title, POSITIVE_TERMS) * 0.35 - countMatches(title, NEGATIVE_TERMS) * 0.35;
  const summaryScore = countMatches(summary, POSITIVE_TERMS) * 0.18 - countMatches(summary, NEGATIVE_TERMS) * 0.18;
  const score = clampScore(titleScore + summaryScore);
  const sentimentScore = Number(score.toFixed(3));

  return {
    sentimentScore,
    sentimentLabel: toLabel(sentimentScore)
  };
}
