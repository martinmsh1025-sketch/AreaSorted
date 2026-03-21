export default function BookingsLoading() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: 20, width: 100, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
          <div style={{ height: 28, width: 200, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.5rem" }} />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="panel card" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ height: 18, width: 160, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
                <div style={{ height: 14, width: 120, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.4rem" }} />
              </div>
              <div style={{ height: 16, width: 80, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
