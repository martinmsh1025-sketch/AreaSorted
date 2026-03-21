import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="container" style={{ maxWidth: 500, textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-brand)", margin: "0 0 0.5rem" }}>
          404
        </h1>
        <h2 className="title" style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
          Page not found
        </h2>
        <p className="lead" style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="button button-primary">
            Go home
          </Link>
          <Link href="/contact" className="button button-secondary">
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
