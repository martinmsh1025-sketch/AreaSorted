import { providerLoginAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

type ProviderLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderLoginPage({ searchParams }: ProviderLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const hasError = Boolean(error);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider login</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Sign in</h1>
          <p className="lead">Use the email and password linked to your invite.</p>
          <div className="panel-soft" style={{ padding: "0.75rem", marginBottom: "0.8rem" }}>
            <div className="eyebrow">First time here?</div>
            <div className="quote-summary-list" style={{ marginTop: "0.75rem" }}>
              <div><span>1</span><strong>Open your invite</strong></div>
              <div><span>2</span><strong>Verify email</strong></div>
              <div><span>3</span><strong>Create password</strong></div>
            </div>
          </div>
          <form action={providerLoginAction} className="mini-form" style={{ padding: 0 }}>
            <input type="email" name="email" placeholder="Provider email" aria-label="Provider email" />
            <input type="password" name="password" placeholder="Password" aria-label="Password" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error === "invite_not_completed" ? "Your invite exists, but setup is not finished yet. Open the invite link, verify email, and create your password first." : "Incorrect email or password."}</p> : null}
            <FormSubmitButton label="Sign in" pendingLabel="Signing in" />
          </form>
          <a href="/provider/forgot-password" className="button button-secondary" style={{ justifyContent: "center" }}>Reset password</a>
        </div>
      </div>
    </main>
  );
}
