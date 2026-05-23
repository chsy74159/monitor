import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketMoodPanel } from "@/components/dashboard/market-mood-panel";

describe("MarketMoodPanel", () => {
  it("shows mood label, score, and timestamp", () => {
    render(
      <MarketMoodPanel
        mood={{
          window_start: "2026-05-22T16:00:00.000Z",
          mood_label: "risk_on",
          mood_score: 0.42,
          etf_sentiment: 0.3,
          mega_cap_sentiment: 0.5,
          positive_breadth: 0.7,
          negative_breadth: 0.1
        }}
      />
    );

    expect(screen.getByText("Risk-on")).toBeInTheDocument();
    expect(screen.getByText("0.42")).toBeInTheDocument();
    expect(screen.getByText(/Last update/)).toBeInTheDocument();
  });
});
