import Link from "next/link";
import { customerRegisterAction } from "../login/actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";

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
    email_taken: "An account with this email already exists. Please sign in instead.",
  };

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="panel card" style={{ padding: "2rem" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Customer account</div>
          <h1 className="title" style={{ marginTop: "0.4rem", fontSize: "1.5rem", textAlign: "center" }}>
            Create account
          </h1>
          <p className="lead" style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Create an account to track your bookings and manage your services.
          </p>

          <form action={customerRegisterAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label className="quote-field-stack">
                <span>First name</span>
                <input type="text" name="firstName" placeholder="Jane" required />
              </label>
              <label className="quote-field-stack">
                <span>Last name</span>
                <input type="text" name="lastName" placeholder="Smith" required />
              </label>
            </div>

            <label className="quote-field-stack">
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>

            <label className="quote-field-stack">
              <span>Phone</span>
              <input type="tel" name="phone" placeholder="07700 900000" required />
            </label>

            <label className="quote-field-stack">
              <span>Password</span>
              <input type="password" name="password" placeholder="At least 8 characters" required minLength={8} />
            </label>

            {error && (
              <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>
                {errorMessages[error] || "Something went wrong. Please try again."}
              </p>
            )}

            <button type="submit" className="button button-primary" style={{ width: "100%" }}>
              Create account
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link href="/customer/login" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
