interface Topic {
  id: string;
  label: string;
  summary: string | null;
  symbols: string[] | null;
  score: number | null;
}

export function TopicList({ topics }: { topics: Topic[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Narrative</p>
          <h2>Topics</h2>
        </div>
      </div>
      <div className="stack">
        {topics.length === 0 ? <p className="muted">No topic clusters yet.</p> : null}
        {topics.map((topic) => (
          <article key={topic.id} className="list-item">
            <div className="list-item-header">
              <strong>{topic.label}</strong>
              <span>{topic.score?.toFixed(2) ?? "0.00"}</span>
            </div>
            <p>{topic.summary ?? "No summary available."}</p>
            <span className="symbol-strip">{(topic.symbols ?? []).join(", ") || "No linked symbols"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
