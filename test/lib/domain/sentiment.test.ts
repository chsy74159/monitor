import { describe, expect, it } from "vitest";
import { bearishTeslaArticle, bullishNvidiaArticle, macroArticle } from "@/test/fixtures/articles";
import { scoreArticleSentiment } from "@/lib/domain/sentiment";

describe("scoreArticleSentiment", () => {
  it("scores bullish earnings language as positive", () => {
    const result = scoreArticleSentiment(bullishNvidiaArticle);
    expect(result.sentimentLabel).toBe("positive");
    expect(result.sentimentScore).toBeGreaterThan(0.3);
  });

  it("scores guidance cuts and downgrades as negative", () => {
    const result = scoreArticleSentiment(bearishTeslaArticle);
    expect(result.sentimentLabel).toBe("negative");
    expect(result.sentimentScore).toBeLessThan(-0.3);
  });

  it("scores higher yields and hot inflation as negative macro sentiment", () => {
    const result = scoreArticleSentiment(macroArticle);
    expect(result.sentimentLabel).toBe("negative");
    expect(result.sentimentScore).toBeLessThan(-0.2);
  });
});
