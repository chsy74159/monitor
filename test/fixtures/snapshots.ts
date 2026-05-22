import type { MarketSnapshot } from "@/lib/domain/types";

export const snapshotWindow = "2026-05-22T16:00:00.000Z";

export const marketSnapshots: MarketSnapshot[] = [
  { symbol: "SPY", capturedAt: snapshotWindow, price: 650, changePercent: 0.6, volume: 1000000, source: "fixture" },
  { symbol: "QQQ", capturedAt: snapshotWindow, price: 560, changePercent: 0.9, volume: 900000, source: "fixture" },
  { symbol: "NVDA", capturedAt: snapshotWindow, price: 140, changePercent: 2.4, volume: 800000, source: "fixture" },
  { symbol: "TSLA", capturedAt: snapshotWindow, price: 180, changePercent: -1.2, volume: 700000, source: "fixture" },
];
