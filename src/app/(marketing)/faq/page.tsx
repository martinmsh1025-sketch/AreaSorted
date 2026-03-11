const faqs = [
  "How are cleaners verified?",
  "Do I need to provide cleaning supplies?",
  "How do cleaner applications work?",
  "What if a cleaner cancels?",
  "How do reschedules and refunds work?",
];

export default function FaqPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="eyebrow">FAQ</div>
        <h1 className="title" style={{ marginTop: "0.6rem" }}>Frequently asked questions</h1>
        <div className="panel card" style={{ marginTop: "2rem" }}>
          <ul className="list-clean">
            {faqs.map((faq) => (
              <li key={faq} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>{faq}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
