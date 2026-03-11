const cleanerFaqs = [
  "What documents do I need to apply?",
  "Do I need my own cleaning supplies?",
  "How are jobs offered to cleaners?",
  "What happens if I cancel a job?",
  "Do I need a DBS check?",
  "How do I know the company is genuine?",
];

export default function CleanerFaqPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="eyebrow">Cleaner FAQ</div>
        <h1 className="title" style={{ marginTop: "0.6rem" }}>Questions applicants ask before they trust a platform.</h1>
        <div className="panel card" style={{ marginTop: "2rem" }}>
          <ul className="list-clean">
            {cleanerFaqs.map((faq) => (
              <li key={faq} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>{faq}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
