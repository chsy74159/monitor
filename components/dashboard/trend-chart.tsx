"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendPoint {
  symbol?: string;
  window_start: string;
  avg_sentiment: number | null;
}

export function TrendChart({ rows }: { rows: TrendPoint[] }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Latest Window</p>
          <h2>Sentiment Curve</h2>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No sentiment points yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows}>
            <XAxis dataKey="symbol" tickLine={false} axisLine={false} />
            <YAxis domain={[-1, 1]} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              contentStyle={{
                background: "#181b18",
                border: "1px solid #34382f",
                borderRadius: 8,
                color: "#f4f1e8"
              }}
            />
            <Line type="monotone" dataKey="avg_sentiment" stroke="#8fd14f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
