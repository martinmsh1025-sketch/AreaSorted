import { sendProviderLoginOtpAction, verifyProviderEmailOtpAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Mail, ShieldCheck } from "lucide-react";
import { getPrisma } from "@/lib/db";

type ProviderVerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderVerifyEmailPage({ searchParams }: ProviderVerifyEmailPageProps) {
  const params = (await searchParams) ?? {};
  const email = typeof params.email === "string" ? params.email : "";
  const delivery = typeof params.delivery === "string" ? params.delivery : "";
  const deliveryReason = typeof params.deliveryReason === "string" ? params.deliveryReason : "";
  const purpose = typeof params.purpose === "string" ? params.purpose : "INVITE";
  const hasError = params.error === "invalid_code";
  const routed = params.routed === "1";
  const showDevFallback = delivery === "dev";
  const sentByEmail = delivery === "email";
  let devCode = "";

  if (showDevFallback && email && process.env.NODE_ENV !== "production") {
    const prisma = getPrisma();
    const latestOtpLog = await prisma.notificationLogV2.findFirst({
      where: {
        recipient: email.toLowerCase(),
        templateCode: `provider_otp_${purpose.toLowerCase()}`,
      },
      orderBy: { createdAt: "desc" },
      select: { payloadJson: true },
    });

    const payload = latestOtpLog?.payloadJson;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const rawCode = (payload as Record<string, unknown>).devCode;
      if (typeof rawCode === "string") {
        devCode = rawCode;
      }
    }
  }

  return (
    <div className="provider-auth-shell">
      <div className="provider-auth-panel provider-auth-grid">
        <div className="provider-auth-hero">
          <div className="provider-auth-eyebrow">
            <ShieldCheck className="size-3.5" />
            Email verification
          </div>
          <h1 className="provider-auth-title">Verify your provider email to continue onboarding.</h1>
          <p className="provider-auth-copy">
            We send a one-time code before password setup so every new provider account starts from a verified email address.
          </p>
          <div className="provider-auth-note">
            <strong>Why this matters</strong>
            Verified email gives you access to password setup, onboarding progress, and all later provider portal updates.
          </div>
        </div>

        <div className="space-y-4">

        {/* Delivery info */}
        <Card className="provider-auth-card border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {showDevFallback ? "Dev fallback" : "Code delivery"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {showDevFallback
                ? "Email sending is disabled. The OTP is shown below for testing."
                : sentByEmail
                  ? `We sent a code to ${email || "your provider email"}.`
                  : "Enter the one-time code to continue."}
            </p>
            {showDevFallback && deliveryReason && (
              <p className="text-xs text-muted-foreground">Reason: {deliveryReason.replace(/_/g, " ")}</p>
            )}
            {devCode && (
              <Badge variant="secondary" className="mt-1 font-mono text-sm">{devCode}</Badge>
            )}
            {routed && (
              <p className="text-xs text-green-700 dark:text-green-400">
                This account is already verified. Continue to the next step after login.
              </p>
            )}
          </CardContent>
        </Card>

        {/* OTP form */}
        <Card className="provider-auth-card">
          <CardContent className="pt-6">
            <form action={verifyProviderEmailOtpAction} className="space-y-4">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="purpose" value={purpose} />
              <div className="space-y-2">
                <Label htmlFor="code">One-time code</Label>
                <Input id="code" name="code" placeholder="Enter OTP code" required />
              </div>

              {hasError && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>The code is invalid or expired. Request a new one.</span>
                </div>
              )}

              <FormSubmitButton
                label="Verify and continue"
                pendingLabel="Verifying..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm font-medium transition-colors"
              />
            </form>
          </CardContent>
        </Card>

        {/* Resend form */}
        <form action={sendProviderLoginOtpAction}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="purpose" value={purpose} />
          <FormSubmitButton
            variant="outline"
            label="Send a new code"
            pendingLabel="Sending..."
            disabled={!email}
            className="w-full inline-flex items-center justify-center rounded-lg border border-input bg-background h-9 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          />
        </form>
        </div>
      </div>
    </div>
  );
}
