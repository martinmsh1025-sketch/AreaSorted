"use client";

export default function ProviderError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="panel card">
          <div className="eyebrow">Provider portal error</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Something went wrong in the provider portal.</h1>
          <p className="lead">{error.message || "An unexpected error occurred."}</p>
          <button className="button button-primary" onClick={reset}>Try again</button>
        </div>
      </div>
    </main>
  );
}
