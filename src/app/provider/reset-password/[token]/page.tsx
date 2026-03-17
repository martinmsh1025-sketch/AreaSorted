import { notFound } from "next/navigation";
import { getProviderAuthToken } from "@/lib/providers/auth-tokens";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { setProviderPasswordAction } from "./actions";

type ProviderResetPasswordPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderResetPasswordPage({ params, searchParams }: ProviderResetPasswordPageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const mode = query.mode === "reset" ? "reset" : "setup";
  const error = typeof query.error === "string" ? query.error : "";

  const record = await getProviderAuthToken({
    rawToken: token,
    purpose: mode === "reset" ? "PASSWORD_RESET" : "PASSWORD_SETUP",
  });

  if (!record) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider access</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {mode === "reset" ? "Reset your password" : "Create your password"}
          </h1>
          <p className="lead">
            {mode === "reset"
              ? "Choose a new password to get back into the provider portal."
              : "Set your password to unlock provider login and continue onboarding."}
          </p>
          <p className="lead" style={{ marginTop: "0.6rem" }}>Use at least 8 characters with letters and numbers.</p>
          <form action={setProviderPasswordAction} className="mini-form" style={{ padding: 0 }}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="mode" value={mode} />
            <input type="password" name="password" placeholder="New password" aria-label="New password" autoComplete="new-password" defaultValue="" />
            <input type="password" name="confirmPassword" placeholder="Confirm password" aria-label="Confirm password" autoComplete="new-password" defaultValue="" />
            {error === "password_too_short" ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Use at least 8 characters.</p> : null}
            {error === "password_mismatch" ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>Passwords do not match.</p> : null}
            <FormSubmitButton label={mode === "reset" ? "Save new password" : "Create password"} pendingLabel="Saving password" />
          </form>
        </div>
      </div>
    </main>
  );
}
