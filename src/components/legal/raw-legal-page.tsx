type RawLegalPageProps = {
  eyebrow?: string;
  title: string;
  content: string;
};

export function RawLegalPage({ eyebrow = "Legal", title, content }: RawLegalPageProps) {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="panel card space-y-6">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="title" style={{ marginTop: "0.6rem" }}>{title}</h1>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-body)", fontSize: "0.96rem", lineHeight: 1.75, margin: 0, color: "var(--color-text)" }}>
            {content}
          </pre>
        </div>
      </div>
    </main>
  );
}
