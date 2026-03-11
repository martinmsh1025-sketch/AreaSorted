const sitemapGroups = {
  Customer: [
    ["/", "Home"],
    ["/services", "Services"],
    ["/pricing", "Pricing"],
    ["/instant-quote", "Instant Quote"],
    ["/faq", "FAQ"],
    ["/contact", "Contact Us"],
  ],
  Cleaners: [
    ["/become-a-cleaner", "Become a Cleaner"],
    ["/cleaner/apply", "Cleaner Application"],
    ["/become-a-cleaner", "Cleaner FAQ"],
    ["/terms-and-conditions", "Cleaner Terms"],
  ],
  Company: [
    ["/about", "About Us"],
    ["/services", "Areas We Cover"],
  ],
  Legal: [
    ["/terms-and-conditions", "Terms & Conditions"],
    ["/privacy-policy", "Privacy Policy"],
    ["/gdpr-policy", "GDPR Policy"],
    ["/cookie-policy", "Cookie Policy"],
  ],
};

export default function SitemapPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">Sitemap</div>
        <h1 className="title" style={{ marginTop: "0.6rem" }}>Everything important in one place.</h1>
        <div className="grid-3" style={{ marginTop: "2rem" }}>
          {Object.entries(sitemapGroups).map(([group, links]) => (
            <section key={group} className="panel card">
              <strong>{group}</strong>
              <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
                {links.map(([href, label]) => (
                  <li key={href + label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
