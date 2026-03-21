"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Manrope, sans-serif", margin: 0, padding: 0 }}>
        <main style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}>
          <div style={{ maxWidth: 500, textAlign: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "1rem", color: "#666", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#d9252a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.6rem 1.5rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
