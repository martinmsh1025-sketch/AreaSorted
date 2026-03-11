const customerLinks = [
  ["/services", "Services"],
  ["/pricing", "Pricing"],
  ["/instant-quote", "Instant Quote"],
  ["/faq", "FAQ"],
  ["/contact", "Contact Us"],
];

const cleanerLinks = [
  ["/become-a-cleaner", "Become a Cleaner"],
  ["/cleaner/apply", "Cleaner Application"],
  ["/cleaner/faq", "Cleaner FAQ"],
  ["/cleaner-terms", "Cleaner Terms"],
];

const legalLinks = [
  ["/terms-and-conditions", "Terms & Conditions"],
  ["/privacy-policy", "Privacy Policy"],
  ["/gdpr-policy", "GDPR Policy"],
  ["/cookie-policy", "Cookie Policy"],
];

const sitemapLinks = [
  ["/about", "About Us"],
  ["/services", "Areas We Cover"],
  ["/sitemap", "Site Map"],
  ["/services", "London Service Pages"],
];

function LinkList({ items }: { items: string[][] }) {
  return (
    <ul className="list-clean">
      {items.map(([href, label]) => (
        <li key={href + label}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer section">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--color-accent)", marginBottom: "0.7rem" }}>WashHub</div>
            <p className="footer-brand-copy">
              Trusted cleaning across London with verified cleaners, clear booking, and practical support for customers and applicants.
            </p>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>support@washhub.co.uk</li>
              <li>020 0000 0000</li>
              <li>Mon-Fri, 9am-6pm</li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Customer</div>
            <LinkList items={customerLinks} />
          </div>
          <div>
            <div className="footer-title">Cleaners</div>
            <LinkList items={cleanerLinks} />
          </div>
          <div>
            <div className="footer-title">Legal</div>
            <LinkList items={legalLinks} />
          </div>
          <div>
            <div className="footer-title">Sitemap</div>
            <LinkList items={sitemapLinks} />
          </div>
        </div>
        <div className="footer-bottom">© 2026 WashHub. Company number to be added before launch.</div>
      </div>
    </footer>
  );
}
