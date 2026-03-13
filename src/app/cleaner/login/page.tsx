import { cleanerLoginAction } from "./actions";

type CleanerLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CleanerLoginPage({ searchParams }: CleanerLoginPageProps) {
  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Cleaner login</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Sign in to jobs and earnings</h1>
          <p className="lead">Cleaners log in to view upcoming jobs, past jobs, and earnings.</p>
          <form action={cleanerLoginAction} className="mini-form" style={{ padding: 0 }}>
            <input type="email" name="email" placeholder="Cleaner email" aria-label="Cleaner email" />
            <input type="password" name="password" placeholder="Cleaner password" aria-label="Cleaner password" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Incorrect cleaner login details.</p> : null}
            <button className="button button-primary" type="submit">Login</button>
          </form>
        </div>
      </div>
    </main>
  );
}
