import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";

export default async function AccountSettingsPage() {
  await requireCustomerSession();

  return (
    <div className="space-y-6">
      <div className="panel card account-hero-card">
        <div className="eyebrow">Settings</div>
        <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem" }}>Account settings</h1>
        <p className="lead" style={{ fontSize: "0.95rem" }}>
          Manage password access, get support, and review the policies that apply to your bookings.
        </p>
      </div>

      <div className="grid-2" style={{ gap: "1rem" }}>
        <div className="panel card">
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.6rem" }}>Security</h2>
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>
            Need to change your password? Use the reset flow to send yourself a fresh secure password link.
          </p>
          <Link href="/customer/forgot-password" className="button button-primary">Reset password</Link>
        </div>

        <div className="panel card">
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.6rem" }}>Support</h2>
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>
            If something looks wrong with a booking, pricing, or provider update, contact support from the help page.
          </p>
          <Link href="/support" className="button button-secondary">Contact support</Link>
        </div>
      </div>

      <div className="panel card">
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.8rem" }}>Policies</h2>
        <div className="button-row">
          <Link href="/terms-and-conditions" className="button button-secondary">Terms</Link>
          <Link href="/refund-policy" className="button button-secondary">Refund policy</Link>
          <Link href="/privacy-policy" className="button button-secondary">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
