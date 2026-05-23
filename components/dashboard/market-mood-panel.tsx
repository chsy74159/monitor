interface MarketMoodPanelProps {
  mood: {
    window_start: string;
    mood_label: "risk_on" | "neutral" | "risk_off";
    mood_score: number | null;
    etf_sentiment: number | null;
    mega_cap_sentiment: number | null;
    positive_breadth: number | null;
    negative_breadth: number | null;
  } | null;
}

function labelForMood(value: string): string {
  if (value === "risk_on") {
    return "Risk-on";
  }

  if (value === "risk_off") {
    return "Risk-off";
  }

  return "Neutral";
}

function formatScore(value: number | null): string {
  return value?.toFixed(2) ?? "0.00";
}

export function MarketMoodPanel({ mood }: MarketMoodPanelProps) {
  if (!mood) {
    return (
      <section className="panel mood-panel empty-panel">
        <div>
          <p className="eyebrow">Market Mood</p>
          <h2>No data yet</h2>
          <p className="muted">Waiting for the first hourly ingest window.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`panel mood-panel mood-${mood.mood_label}`}>
      <div>
        <p className="eyebrow">Market Mood</p>
        <h2>{labelForMood(mood.mood_label)}</h2>
        <p className="muted">Last update {new Date(mood.window_start).toLocaleString()}</p>
      </div>
      <div className="metric-row" aria-label="Market mood metrics">
        <div>
          <span>Score</span>
          <strong>{formatScore(mood.mood_score)}</strong>
        </div>
        <div>
          <span>ETF</span>
          <strong>{formatScore(mood.etf_sentiment)}</strong>
        </div>
        <div>
          <span>Mega-cap</span>
          <strong>{formatScore(mood.mega_cap_sentiment)}</strong>
        </div>
        <div>
          <span>Positive breadth</span>
          <strong>{formatScore(mood.positive_breadth)}</strong>
        </div>
        <div>
          <span>Negative breadth</span>
          <strong>{formatScore(mood.negative_breadth)}</strong>
        </div>
      </div>
    </section>
  );
}
