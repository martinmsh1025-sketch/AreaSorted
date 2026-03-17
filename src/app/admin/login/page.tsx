import { adminLoginAction } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const hasError = Boolean(error);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Admin login</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Admin sign in</h1>
          <p className="lead">For internal team only.</p>
          <form action={adminLoginAction} className="mini-form" style={{ padding: 0 }}>
            <input type="email" name="email" placeholder="Admin email" aria-label="Admin email" />
            <input type="password" name="password" placeholder="Admin password" aria-label="Admin password" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error === "not_provisioned" ? "This account does not have admin access." : "Incorrect email or password."}</p> : null}
            <button className="button button-primary" type="submit">Sign in</button>
          </form>
        </div>
      </div>
    </main>
  );
}
