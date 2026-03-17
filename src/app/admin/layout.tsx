import { getAdminSession } from "@/lib/admin-auth";
import { adminLogoutAction } from "@/app/admin/login/actions";

const adminNav = [
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  return (
    <div className="backoffice-shell backoffice-admin-shell">
      <header className="backoffice-topbar">
        <div className="container backoffice-topbar-inner">
          <div>
            <div className="backoffice-kicker">AreaSorted Admin</div>
            <strong className="backoffice-brand-title">{session ? session.email : "Operational control panel"}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <nav className="backoffice-nav">
              {adminNav.map((item) => (
                <a key={item.href} href={item.href} className="backoffice-nav-link">
                  {item.label}
                </a>
              ))}
            </nav>
            {session ? (
              <form action={adminLogoutAction}>
                <button type="submit" className="button button-secondary">Logout</button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <div className="backoffice-body">{children}</div>
    </div>
  );
}
