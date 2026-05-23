interface AlertRow {
  id: string;
  symbol: string | null;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

export function AlertList({ alerts }: { alerts: AlertRow[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Exceptions</p>
          <h2>Alerts</h2>
        </div>
      </div>
      <div className="stack">
        {alerts.length === 0 ? <p className="muted">No alerts in the latest window.</p> : null}
        {alerts.map((alert) => (
          <article key={alert.id} className={`list-item alert-${alert.severity}`}>
            <div className="list-item-header">
              <strong>{alert.symbol ?? "Market"}</strong>
              <span>{alert.severity}</span>
            </div>
            <p>{alert.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
