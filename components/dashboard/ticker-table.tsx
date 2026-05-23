interface TickerRow {
  symbol: string;
  price_change_percent: number | null;
  avg_sentiment: number | null;
  news_count: number;
  mention_heat: number | null;
  sentiment_velocity: number | null;
}

function signedPercent(value: number | null): string {
  if (value === null) {
    return "0.00%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function scoreClass(value: number | null): string {
  if ((value ?? 0) >= 0.2) {
    return "score-positive";
  }

  if ((value ?? 0) <= -0.2) {
    return "score-negative";
  }

  return "score-neutral";
}

export function TickerTable({ rows }: { rows: TickerRow[] }) {
  return (
    <section className="panel ticker-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Watchlist</p>
          <h2>Ticker Sentiment</h2>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Sentiment</th>
              <th>News</th>
              <th>Heat</th>
              <th>Velocity</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No ticker rows in the latest window.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.symbol}>
                <td>
                  <strong>{row.symbol}</strong>
                </td>
                <td className={scoreClass(row.price_change_percent)}>{signedPercent(row.price_change_percent)}</td>
                <td className={scoreClass(row.avg_sentiment)}>{row.avg_sentiment?.toFixed(2) ?? "0.00"}</td>
                <td>{row.news_count}</td>
                <td>{row.mention_heat?.toFixed(2) ?? "0.00"}x</td>
                <td className={scoreClass(row.sentiment_velocity)}>{row.sentiment_velocity?.toFixed(2) ?? "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
