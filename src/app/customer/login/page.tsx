import Link from "next/link";
import { customerLoginAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { GoogleSignInButton } from "@/components/customer/google-signin-button";
import { getSafeRedirectPath } from "@/lib/security/redirect";

type CustomerLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const session = await getCustomerSession();

  const params = (await searchParams) ?? {};
  const redirectTo = typeof params.redirectTo === "string" ? getSafeRedirectPath(params.redirectTo, "/account") : "/account";
  if (session) redirect(redirectTo);
  const error = typeof params.error === "string" ? params.error : "";
  const errorMessage = error === "invalid_reset_token"
    ? "This reset link is invalid or has expired. Request a new password reset email."
    : error === "google_unavailable"
      ? "Google sign-in is not configured yet. Use email and password for now."
      : error === "google_failed"
        ? "Google sign-in could not be completed. Please try again or use email and password."
    : error
      ? "Incorrect email or password."
      : "";

  return (
    <main className="section">
      <div className="container auth-split-container">
        <div className="auth-split-shell">
          <section className="auth-split-panel auth-split-panel-brand">
            <div className="eyebrow">Customer account</div>
            <h1 className="title" style={{ marginTop: "0.5rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Sign in and manage your bookings in one place.
            </h1>
            <p className="lead" style={{ marginTop: "0.75rem", fontSize: "1rem" }}>
              Check booking progress, respond to provider updates, review receipts, and keep every service request in one clean customer portal.
            </p>
            <div className="auth-benefit-list">
              <div className="auth-benefit-item">
                <strong>Track every booking</strong>
                <span>See upcoming visits, payment status, and provider confirmation updates.</span>
              </div>
              <div className="auth-benefit-item">
                <strong>Respond quickly</strong>
                <span>Accept or decline provider counter offers without chasing support.</span>
              </div>
              <div className="auth-benefit-item">
                <strong>Keep everything together</strong>
                <span>Manage cancellations, reschedules, and receipts from the same account.</span>
              </div>
            </div>
          </section>

          <section className="panel card auth-page-card auth-split-panel auth-split-panel-form">
            <div className="eyebrow" style={{ textAlign: "center" }}>Customer login</div>
            <h2 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
              Welcome back
            </h2>
            <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Access your bookings, manage your account, and review your latest service updates.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <GoogleSignInButton label="Continue with Google" />
              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>or sign in with email</p>
            </div>

            <form action={customerLoginAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="quote-field-stack">
                <span>Email</span>
                <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} />
              </label>

              <label className="quote-field-stack">
                <span>Password</span>
                <input type="password" name="password" placeholder="Your password" autoComplete="current-password" required maxLength={128} />
              </label>

              {errorMessage && (
                <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                  {errorMessage}
                </p>
              )}

              <FormSubmitButton label="Sign in" pendingLabel="Signing in..." className="button button-primary" />
            </form>

            <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.85rem" }}>
              <Link href="/customer/forgot-password" style={{ color: "var(--color-brand)", fontWeight: 500 }}>
                Forgot your password?
              </Link>
            </p>

            <p style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Don&apos;t have an account?{" "}
              <Link href="/customer/register" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
