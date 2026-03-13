import { adminLoginAction } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Admin login</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Sign in to WashHub admin</h1>
          <p className="lead">Only internal staff should access the admin booking area.</p>
          <form action={adminLoginAction} className="mini-form" style={{ padding: 0 }}>
            <input type="password" name="password" placeholder="Admin password" aria-label="Admin password" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Incorrect password. Please try again.</p> : null}
            <button className="button button-primary" type="submit">Login</button>
          </form>
        </div>
      </div>
    </main>
  );
}
