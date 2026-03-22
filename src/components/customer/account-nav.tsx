"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/payments", label: "Payment history" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/settings", label: "Settings" },
];

export function CustomerAccountNav() {
  const pathname = usePathname();

  return (
    <nav className="account-nav-card panel card">
      <div className="eyebrow">Customer portal</div>
      <div className="account-nav-links">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`account-nav-link${active ? " account-nav-link-active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
