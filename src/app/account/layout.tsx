import { CustomerShell } from "@/components/layout/customer-shell";
import { CustomerAccountNav } from "@/components/customer/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerShell>
      <main className="section">
        <div className="container account-shell">
          <div className="account-portal-layout">
            <aside className="account-portal-sidebar">
              <CustomerAccountNav />
            </aside>
            <div className="account-portal-main">{children}</div>
          </div>
        </div>
      </main>
    </CustomerShell>
  );
}
