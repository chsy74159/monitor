import { describe, expect, it } from "vitest";
import { scoreArticleSentiment } from "@/lib/domain/sentiment";
import { bearishTeslaArticle, bullishNvidiaArticle, macroArticle } from "@/test/fixtures/articles";

describe("scoreArticleSentiment", () => {
  it("scores bullish earnings language as positive", () => {
    const sentiment = scoreArticleSentiment(bullishNvidiaArticle);

    expect(sentiment.label).toBe("positive");
    expect(sentiment.score).toBeGreaterThan(0.3);
  });

  it("scores guidance cuts and downgrades as negative", () => {
    const sentiment = scoreArticleSentiment(bearishTeslaArticle);

    expect(sentiment.label).toBe("negative");
    expect(sentiment.score).toBeLessThan(-0.3);
  });

  it("scores higher yields and hot inflation macro language as negative", () => {
    const sentiment = scoreArticleSentiment(macroArticle);

    expect(sentiment.label).toBe("negative");
    expect(sentiment.score).toBeLessThan(-0.2);
  });
});
