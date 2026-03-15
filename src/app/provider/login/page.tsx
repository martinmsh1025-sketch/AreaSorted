import { providerLoginAction } from "./actions";

type ProviderLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderLoginPage({ searchParams }: ProviderLoginPageProps) {
  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider login</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Sign in to provider portal</h1>
          <p className="lead">Use the invited company email to open the provider dashboard.</p>
          <form action={providerLoginAction} className="mini-form" style={{ padding: 0 }}>
            <input type="email" name="email" placeholder="Provider email" aria-label="Provider email" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Provider account not found. Please check the invite email.</p> : null}
            <button className="button button-primary" type="submit">Login</button>
          </form>
        </div>
      </div>
    </main>
  );
}
