export default function BookingDetailLoading() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ height: 16, width: 120, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginBottom: "1.25rem" }} />
        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: 20, width: 100, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
          <div style={{ height: 28, width: 250, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.5rem" }} />
          <div style={{ height: 14, width: 180, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.3rem" }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="panel card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ height: 22, width: 140, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginBottom: "0.75rem" }} />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ height: 18, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.5rem" }} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
