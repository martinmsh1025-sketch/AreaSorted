import { AreaSortedLogo } from "@/components/branding/areasorted-logo";

const customerLinks = [
  ["/services", "Services"],
  ["/pricing", "Pricing"],
  ["/advice", "Advice Hub"],
  ["/quote", "Continue Booking"],
  ["/faq", "FAQ"],
  ["/support", "Customer Support"],
];

const cleanerLinks = [
  ["/become-a-cleaner", "Become a Provider"],
  ["/contact", "Provider Enquiries"],
  ["/cleaner-terms", "Provider Terms"],
];

const legalLinks = [
  ["/terms-and-conditions", "Terms & Conditions"],
  ["/privacy-policy", "Privacy Policy"],
  ["/refund-policy", "Cancellation & Refund"],
  ["/gdpr-policy", "GDPR Policy"],
  ["/cookie-policy", "Cookie Policy"],
];

const sitemapLinks = [
  ["/about", "About Us"],
  ["/services", "All Services"],
  ["/advice", "Advice Hub"],
  ["/faq", "Help Centre"],
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
      <div className="container footer-shell">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <div className="footer-brand-mark">
              <AreaSortedLogo />
            </div>
            <p className="footer-brand-copy">
              Trusted local services across London with postcode-first matching, clear booking, and practical support from quote to follow-up.
            </p>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>support@areasorted.com</li>
              <li>Mon-Fri, 9am-6pm</li>
              <li>London coverage across all 32 boroughs</li>
            </ul>
          </div>
          <div className="footer-column">
            <div className="footer-title">Customer</div>
            <LinkList items={customerLinks} />
          </div>
          <div className="footer-column">
            <div className="footer-title">Providers</div>
            <LinkList items={cleanerLinks} />
          </div>
          <div className="footer-column">
            <div className="footer-title">Legal</div>
            <LinkList items={legalLinks} />
          </div>
          <div className="footer-column">
            <div className="footer-title">Sitemap</div>
            <LinkList items={sitemapLinks} />
          </div>
        </div>
        <div className="footer-bottom">© 2026 AreaSorted.com.</div>
      </div>
    </footer>
  );
}
