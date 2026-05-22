import type { TickerConfig } from "@/lib/domain/types";

export const MONITORED_TICKERS: TickerConfig[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", assetType: "etf", sector: "Broad Market", isActive: true },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetType: "etf", sector: "Technology", isActive: true },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF Trust", assetType: "etf", sector: "Broad Market", isActive: true },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", assetType: "etf", sector: "Small Caps", isActive: true },
  { symbol: "NVDA", name: "NVIDIA", assetType: "stock", sector: "Semiconductors", isActive: true },
  { symbol: "TSLA", name: "Tesla", assetType: "stock", sector: "Consumer Discretionary", isActive: true },
  { symbol: "AAPL", name: "Apple", assetType: "stock", sector: "Technology", isActive: true },
  { symbol: "MSFT", name: "Microsoft", assetType: "stock", sector: "Technology", isActive: true },
  { symbol: "AMD", name: "Advanced Micro Devices", assetType: "stock", sector: "Semiconductors", isActive: true },
  { symbol: "META", name: "Meta Platforms", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "GOOGL", name: "Alphabet", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "AMZN", name: "Amazon", assetType: "stock", sector: "Consumer Discretionary", isActive: true },
  { symbol: "NFLX", name: "Netflix", assetType: "stock", sector: "Communication Services", isActive: true },
  { symbol: "AVGO", name: "Broadcom", assetType: "stock", sector: "Semiconductors", isActive: true }
];

export function getActiveTickers(): TickerConfig[] {
  return MONITORED_TICKERS.filter((ticker) => ticker.isActive);
}
