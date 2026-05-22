import { describe, expect, it } from "vitest";
import { getActiveTickers, MONITORED_TICKERS } from "@/lib/config/tickers";

describe("ticker registry", () => {
  it("contains the approved ETF and stock universe", () => {
    expect(MONITORED_TICKERS.map((ticker) => ticker.symbol)).toEqual([
      "SPY",
      "QQQ",
      "DIA",
      "IWM",
      "NVDA",
      "TSLA",
      "AAPL",
      "MSFT",
      "AMD",
      "META",
      "GOOGL",
      "AMZN",
      "NFLX",
      "AVGO"
    ]);
  });

  it("returns only active tickers", () => {
    expect(getActiveTickers().every((ticker) => ticker.isActive)).toBe(true);
  });
});
