import Link from "next/link";
import { requestCustomerPasswordResetAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerForgotPasswordPage({ searchParams }: Props) {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";
  const sent = params.sent === "1";
  const devLink = typeof params.devLink === "string" ? decodeURIComponent(params.devLink) : "";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="panel card" style={{ padding: "2rem" }}>
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

            {devLink && (
              <div style={{ background: "var(--color-muted, #f5f5f5)", borderRadius: 8, padding: "0.75rem", fontSize: "0.8rem", wordBreak: "break-all" }}>
                Dev reset link:{" "}
                <a href={devLink} style={{ color: "var(--color-brand)", textDecoration: "underline" }}>
                  {devLink}
                </a>
              </div>
            )}

            <button type="submit" className="button button-primary" style={{ width: "100%" }}>
              Send reset link
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
