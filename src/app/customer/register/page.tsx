import Link from "next/link";
import { customerRegisterAction } from "../login/actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

type CustomerRegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerRegisterPage({ searchParams }: CustomerRegisterPageProps) {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";

  const errorMessages: Record<string, string> = {
    missing_fields: "Please fill in all fields.",
    weak_password: "Password must be at least 8 characters.",
    invalid_phone: "Please enter a valid UK phone number.",
    email_taken: "An account with this email already exists. Please sign in instead.",
  };

  return (
    <main className="section">
      <div className="container auth-split-container">
        <div className="auth-split-shell">
          <section className="auth-split-panel auth-split-panel-brand">
            <div className="eyebrow">Customer account</div>
            <h1 className="title" style={{ marginTop: "0.5rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Create your AreaSorted account.
            </h1>
            <p className="lead" style={{ marginTop: "0.75rem", fontSize: "1rem" }}>
              Save your details once, track every booking, and handle future changes from a proper customer portal instead of starting from scratch each time.
            </p>
            <div className="auth-benefit-list">
              <div className="auth-benefit-item">
                <strong>Faster future bookings</strong>
                <span>Your core details stay linked to your profile for the next job.</span>
              </div>
              <div className="auth-benefit-item">
                <strong>Clear booking updates</strong>
                <span>See card hold, provider confirmation, receipts, and support actions in one place.</span>
              </div>
              <div className="auth-benefit-item">
                <strong>Better control</strong>
                <span>Respond to provider changes, reschedule bookings, and contact support quickly.</span>
              </div>
            </div>
          </section>

          <section className="panel card auth-page-card auth-split-panel auth-split-panel-form">
          <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
          <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
            Create account
          </h1>
          <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Create an account to track your bookings and manage your services.
          </p>

          <form action={customerRegisterAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="auth-two-col-fields">
              <label className="quote-field-stack">
                <span>First name</span>
                <input type="text" name="firstName" placeholder="Jane" required maxLength={60} />
              </label>
              <label className="quote-field-stack">
                <span>Last name</span>
                <input type="text" name="lastName" placeholder="Smith" required maxLength={60} />
              </label>
            </div>

            <label className="quote-field-stack">
              <span>Email</span>
              <input id="register-email" type="email" name="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} />
            </label>

            <label className="quote-field-stack">
              <span>Phone</span>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--color-surface)" }}>
                <span style={{ padding: "0.8rem 0.9rem", borderRight: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>+44</span>
                <input id="register-phone" type="tel" name="phone" placeholder="7700 900123" autoComplete="tel-national" inputMode="tel" style={{ border: 0, borderRadius: 0 }} required maxLength={20} />
              </div>
            </label>

            <label className="quote-field-stack">
              <span>Password</span>
              <input id="register-password" type="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} maxLength={128} />
            </label>

            {error && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                {errorMessages[error] || "Something went wrong. Please try again."}
              </p>
            )}

            <FormSubmitButton label="Create account" pendingLabel="Creating account..." className="button button-primary" />
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link href="/customer/login" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
          </section>
        </div>
      </div>
    </main>
  );
}
