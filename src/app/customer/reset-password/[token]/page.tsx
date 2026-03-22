import Link from "next/link";
import { getCustomerAuthToken } from "@/lib/customers/auth-tokens";
import { resetCustomerPasswordAction } from "./actions";

type Props = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerResetPasswordPage({ params, searchParams }: Props) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? query.error : "";

  const record = await getCustomerAuthToken({
    rawToken: token,
    purpose: "PASSWORD_RESET",
  });

  if (!record) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="panel card" style={{ padding: "2rem" }}>
            <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
            <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
              Reset link expired
            </h1>
            <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              This password reset link is invalid or has expired. Request a fresh reset email to continue.
            </p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link href="/customer/forgot-password" className="button button-primary">Request new reset link</Link>
              <Link href="/customer/login" className="button button-secondary">Back to sign in</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="panel card" style={{ padding: "2rem" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
          <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
            Reset your password
          </h1>
          <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Choose a new password for your account.
          </p>

          <form action={resetCustomerPasswordAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input type="hidden" name="token" value={token} />

            <label className="quote-field-stack">
              <span>New password</span>
              <input type="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" required />
            </label>

            <label className="quote-field-stack">
              <span>Confirm password</span>
              <input type="password" name="confirmPassword" placeholder="Re-enter password" autoComplete="new-password" required />
            </label>

              <p style={{ fontSize: "0.8rem", color: "var(--color-muted-foreground, #666)", margin: 0 }}>
              Use at least 8 characters.
              </p>

            {error === "password_too_short" && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                Password must be at least 8 characters.
              </p>
            )}
            {error === "password_mismatch" && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                Passwords do not match.
              </p>
            )}

            <button type="submit" className="button button-primary" style={{ width: "100%" }}>
              Save new password
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem" }}>
            <Link href="/customer/login" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
