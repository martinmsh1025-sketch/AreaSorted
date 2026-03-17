import { sendProviderLoginOtpAction, verifyProviderEmailOtpAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

type ProviderVerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderVerifyEmailPage({ searchParams }: ProviderVerifyEmailPageProps) {
  const params = (await searchParams) ?? {};
  const email = typeof params.email === "string" ? params.email : "";
  const devCode = typeof params.devCode === "string" ? params.devCode : "";
  const delivery = typeof params.delivery === "string" ? params.delivery : "";
  const deliveryReason = typeof params.deliveryReason === "string" ? params.deliveryReason : "";
  const purpose = typeof params.purpose === "string" ? params.purpose : "INVITE";
  const hasError = params.error === "invalid_code";
  const routed = params.routed === "1";
  const showDevFallback = delivery === "dev";
  const sentByEmail = delivery === "email";
  const helperTitle = showDevFallback ? "Dev fallback" : "Code delivery";
  const helperText = showDevFallback
    ? "Email sending is disabled in this local test flow, so the OTP is shown here for manual testing."
    : sentByEmail
      ? `We sent a one-time code to ${email || "your provider email"}.`
      : "Enter the one-time code to continue.";
  const reasonText = deliveryReason ? deliveryReason.replace(/_/g, " ") : "";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Email verification</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Verify your provider email</h1>
          <p className="lead">This step confirms the invited email before password setup.</p>
          <div className="panel-soft" style={{ padding: "1rem" }}>
            <div className="eyebrow">{helperTitle}</div>
            <p className="lead" style={{ margin: "0.5rem 0 0" }}>Email: {email || "provider@example.com"}</p>
            <p className="lead" style={{ margin: "0.35rem 0 0" }}>{helperText}</p>
            {showDevFallback && reasonText ? <p className="lead" style={{ margin: "0.35rem 0 0" }}>Reason: {reasonText}</p> : null}
            {devCode ? <p className="lead" style={{ margin: "0.35rem 0 0" }}>Dev OTP: {devCode}</p> : null}
            {routed ? <p className="lead" style={{ margin: "0.35rem 0 0" }}>This account is already verified. You can continue into the correct provider step after login.</p> : null}
          </div>
          <form action={verifyProviderEmailOtpAction} className="mini-form" style={{ padding: 0 }}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="purpose" value={purpose} />
            <input name="code" placeholder="Enter OTP code" aria-label="OTP code" />
            {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>The code is invalid or expired. Request a new one.</p> : null}
            <FormSubmitButton label="Verify and continue" pendingLabel="Verifying OTP" />
          </form>
          <form action={sendProviderLoginOtpAction} className="mini-form" style={{ padding: 0 }}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="purpose" value={purpose} />
            <FormSubmitButton className="button button-secondary" label="Send a new code" pendingLabel="Sending code" disabled={!email} />
          </form>
        </div>
      </div>
    </main>
  );
}
