"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  navItems: NavItem[];
  accountHref: string;
  accountLabel: string;
};

export function SiteHeaderMobileNav({ navItems, accountHref, accountLabel }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="site-header-mobile-wrap">
      <button
        type="button"
        className="site-header-mobile-toggle"
        aria-expanded={open}
        aria-controls="mobile-site-nav"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && <button type="button" className="site-header-mobile-backdrop" aria-label="Close navigation menu" onClick={() => setOpen(false)} />}

      <div id="mobile-site-nav" className={`site-header-mobile-panel${open ? " site-header-mobile-panel-open" : ""}`}>
        <div className="site-header-mobile-panel-head">
          <strong>Menu</strong>
          <button type="button" className="site-header-mobile-close" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <nav className="site-header-mobile-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="site-header-mobile-link" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href={accountHref} className="site-header-mobile-link site-header-mobile-link-primary" onClick={() => setOpen(false)}>
            {accountLabel}
          </Link>
        </nav>
      </div>
    </div>
  );
}
