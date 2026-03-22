import Link from "next/link";
import { requestCustomerPasswordResetAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerForgotPasswordPage({ searchParams }: Props) {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";
  const sent = params.sent === "1";
  // H-16 FIX: devLink no longer passed via URL params (logged to server console instead)

  return (
    <main className="section">
      <div className="container auth-page-container">
        <div className="panel card auth-page-card">
          <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
          <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
            Forgot password
          </h1>
          <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <form action={requestCustomerPasswordResetAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label className="quote-field-stack">
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>

            {hasError && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                Please enter a valid email address.
              </p>
            )}

            {sent && (
              <p style={{ color: "var(--color-success, #16a34a)", fontSize: "0.9rem", margin: 0 }}>
                If an account with that email exists, we&apos;ve sent a reset link.
              </p>
            )}

            <FormSubmitButton label="Send reset link" pendingLabel="Sending..." className="button button-primary" />
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
