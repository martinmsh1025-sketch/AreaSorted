import { AreaSortedLogo } from "@/components/branding/areasorted-logo";
import { getCustomerSession } from "@/lib/customer-auth";
import Link from "next/link";
import { SiteHeaderMobileNav } from "@/components/layout/site-header-mobile-nav";

const navItems = [
  { href: "/services", label: "Services", icon: "spark" },
  { href: "/pricing", label: "Pricing", icon: "tag" },
  { href: "/quote", label: "Book", icon: "pin" },
  { href: "/become-a-cleaner", label: "Cleaners", icon: "people" },
  { href: "/faq", label: "FAQ", icon: "chat" },
  { href: "/contact", label: "Contact", icon: "phone" },
];

function NavIcon({ icon }: { icon: string }) {
  if (icon === "spark") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L8.1 5L12 6.1L8.1 7.2L7 10.5L5.9 7.2L2 6.1L5.9 5L7 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "tag") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 5.2V2.5H4.7L11.3 9.1L8.6 11.8L2 5.2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <circle cx="4.2" cy="4.2" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "pin") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 12C7 12 10.2 8.7 10.2 5.8C10.2 4.03 8.77 2.6 7 2.6C5.23 2.6 3.8 4.03 3.8 5.8C3.8 8.7 7 12 7 12Z" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="7" cy="5.8" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "people") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="9.4" cy="5.6" r="1.4" stroke="currentColor" strokeWidth="1.1" />
        <path d="M2.8 10.8C3.3 9.5 4.4 8.8 5.8 8.8C7.2 8.8 8.3 9.5 8.8 10.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M8.6 10.6C8.95 9.8 9.7 9.35 10.6 9.35C11.1 9.35 11.55 9.48 11.9 9.75" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "chat") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.3 3.1H11.7V8.5H6.3L3.4 10.8V8.5H2.3V3.1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "phone") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 2.7L5.4 4.8L4.6 5.9C5.15 7.05 6.05 7.95 7.2 8.5L8.3 7.7L10.4 9.1L9.8 11C6.1 10.4 3.1 7.4 2.5 3.7L4 2.7Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "account") {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.1" />
        <path d="M3 11.5C3.5 9.8 5 8.8 7 8.8C9 8.8 10.5 9.8 11 11.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export async function SiteHeader() {
  const customer = await getCustomerSession();
  const accountHref = customer ? "/account" : "/customer/login";
  const accountLabel = customer ? "My Account" : "Login";

  return (
    <header className="site-header-shell">
      <div className="container site-header-grid">
        <Link href="/" className="site-header-brand">
          <AreaSortedLogo compact />
        </Link>

        <nav className="site-header-nav site-header-nav-desktop">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="site-header-link">
              <span style={{ color: "var(--color-brand)", display: "inline-flex", alignItems: "center" }}>
                <NavIcon icon={item.icon} />
              </span>
              <span style={{ color: "var(--color-text)" }}>{item.label}</span>
            </Link>
          ))}

          {customer ? (
            <Link href="/account" className="site-header-link">
              <span style={{ color: "var(--color-brand)", display: "inline-flex", alignItems: "center" }}>
                <NavIcon icon="account" />
              </span>
              <span style={{ color: "var(--color-text)" }}>My Account</span>
            </Link>
          ) : (
            <Link href="/customer/login" className="site-header-link">
              <span style={{ color: "var(--color-brand)", display: "inline-flex", alignItems: "center" }}>
                <NavIcon icon="account" />
              </span>
              <span style={{ color: "var(--color-text)" }}>Login</span>
            </Link>
          )}
        </nav>

        <SiteHeaderMobileNav
          navItems={navItems.map(({ href, label }) => ({ href, label }))}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />
      </div>
    </header>
  );
}
