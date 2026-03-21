import { sendProviderLoginOtpAction, verifyProviderEmailOtpAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Mail, ShieldCheck } from "lucide-react";

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

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            Confirm the invited email before password setup.
          </p>
        </div>

        {/* Delivery info */}
        <Card className="bg-muted/50">
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
        <Card>
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
  );
}
