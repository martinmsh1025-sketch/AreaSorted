import Link from "next/link";
import { customerLoginAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";

type CustomerLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const errorMessage = error === "invalid_reset_token"
    ? "This reset link is invalid or has expired. Request a new password reset email."
    : error
      ? "Incorrect email or password."
      : "";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="panel card" style={{ padding: "2rem" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
          <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
            Sign in
          </h1>
          <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Access your bookings, manage your account, and view service history.
          </p>

          <form action={customerLoginAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label className="quote-field-stack">
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>

            <label className="quote-field-stack">
              <span>Password</span>
              <input type="password" name="password" placeholder="Your password" required />
            </label>

            {errorMessage && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                {errorMessage}
              </p>
            )}

            <button type="submit" className="button button-primary" style={{ width: "100%" }}>
              Sign in
            </button>
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
        </div>
      </div>
    </main>
  );
}
