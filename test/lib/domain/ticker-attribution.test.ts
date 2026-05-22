import { describe, expect, it } from "vitest";
import { MONITORED_TICKERS } from "@/lib/config/tickers";
import { attributeArticleToTickers } from "@/lib/domain/ticker-attribution";
import { macroArticle } from "@/test/fixtures/articles";

describe("attributeArticleToTickers", () => {
  it("uses explicit provider symbols first when available", () => {
    const article = {
      ...macroArticle,
      symbols: ["NVDA", "TSLA", "XYZ"]
    };
    const matches = attributeArticleToTickers(article, MONITORED_TICKERS);

    expect(matches.map((match) => match.symbol).slice(0, 2)).toEqual(["NVDA", "TSLA"]);
    expect(matches.filter((match) => match.relevanceScore === 1).map((match) => match.symbol)).toEqual(["NVDA", "TSLA"]);
  });

  it("detects ETF and megacap names in macro news text", () => {
    const matches = attributeArticleToTickers(macroArticle, MONITORED_TICKERS);
    expect(matches.map((match) => match.symbol)).toEqual(expect.arrayContaining(["SPY", "QQQ", "AAPL", "MSFT", "NVDA"]));
  });

  it("does not match ticker symbols inside unrelated words", () => {
    const article = {
      ...macroArticle,
      title: "Nvidia demand accelerates while spying concerns fade",
      summary: "A technology note mentions broad momentum without index ETF symbols.",
      symbols: []
    };

    expect(attributeArticleToTickers(article, MONITORED_TICKERS).map((match) => match.symbol)).toEqual(["NVDA"]);
  });
});
