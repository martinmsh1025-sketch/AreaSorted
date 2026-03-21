export default function AccountLoading() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: 20, width: 100, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
          <div style={{ height: 28, width: 250, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.5rem" }} />
          <div style={{ height: 16, width: 200, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.3rem" }} />
        </div>
        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: 22, width: 150, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 56, background: "var(--color-muted, #f0f0f0)", borderRadius: 8, marginTop: "0.75rem" }} />
          ))}
        </div>
        <div className="panel card">
          <div style={{ height: 22, width: 150, background: "var(--color-muted, #f0f0f0)", borderRadius: 4 }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 20, background: "var(--color-muted, #f0f0f0)", borderRadius: 4, marginTop: "0.5rem" }} />
          ))}
        </div>
      </div>
    </main>
  );
}
