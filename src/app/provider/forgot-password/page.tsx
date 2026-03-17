import { requestProviderPasswordResetAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

type ProviderForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderForgotPasswordPage({ searchParams }: ProviderForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const hasError = params.error === "1";
  const sent = params.sent === "1";
  const devLink = typeof params.devLink === "string" ? decodeURIComponent(params.devLink) : "";
  const setupRequired = params.setupRequired === "1";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider access</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Forgot password</h1>
          <p className="lead">Enter your provider email and we will send a reset link.</p>
          <form action={requestProviderPasswordResetAction} className="mini-form" style={{ padding: 0 }}>
            <input type="email" name="email" placeholder="Provider email" aria-label="Provider email" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Enter the email address linked to your provider account.</p> : null}
            {setupRequired ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>This provider has not finished invite setup yet. Complete email verification and first password setup from the invite flow.</p> : null}
            {sent ? <p style={{ color: "var(--color-success)", lineHeight: 1.6 }}>If the account exists, a reset link is ready.</p> : null}
            {devLink ? <p className="lead" style={{ margin: 0 }}>Dev reset link: <a href={devLink}>{devLink}</a></p> : null}
            <FormSubmitButton label="Send reset link" pendingLabel="Preparing reset link" />
          </form>
        </div>
      </div>
    </main>
  );
}
