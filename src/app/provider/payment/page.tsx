import { requireProviderStripeAccess } from "@/lib/provider-auth";
import { canProviderAccessStripe } from "@/lib/providers/status";
import { startStripeOnboardingAction, syncStripeStatusAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
} from "lucide-react";

type PaymentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderPaymentPage({
  searchParams,
}: PaymentPageProps) {
  const session = await requireProviderStripeAccess();
  const provider = session.providerCompany;
  const stripe = provider.stripeConnectedAccount;
  const params = (await searchParams) ?? {};
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const status = typeof params.status === "string" ? params.status : "";

  const hasAccount = !!stripe?.stripeAccountId;
  const chargesEnabled = stripe?.chargesEnabled ?? false;
  const payoutsEnabled = stripe?.payoutsEnabled ?? false;
  const detailsSubmitted = stripe?.detailsSubmitted ?? false;
  const fullyConnected = chargesEnabled && payoutsEnabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Payment account</h1>
          <p className="text-sm text-muted-foreground">
            Connect your bank account via Stripe to receive payouts.
          </p>
        </div>
        <Badge
          variant={fullyConnected ? "default" : "outline"}
          className="w-fit"
        >
          {fullyConnected
            ? "Connected"
            : hasAccount
              ? "Incomplete"
              : "Not started"}
        </Badge>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>Stripe error: {error}</span>
          </div>
        </div>
      )}
      {status === "synced" && (
        <div className="rounded-lg border border-green-200 bg-green-50/60 px-4 py-3 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Stripe status synced successfully.</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Status + Actions (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection status card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="size-4 text-blue-600" />
                Stripe Connect status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusItem
                  label="Account created"
                  ok={hasAccount}
                  detail={
                    hasAccount
                      ? `ID: ${stripe!.stripeAccountId.slice(0, 12)}...`
                      : "Not yet created"
                  }
                />
                <StatusItem
                  label="Charges enabled"
                  ok={chargesEnabled}
                  detail={
                    chargesEnabled
                      ? "You can accept payments"
                      : "Complete Stripe setup to enable"
                  }
                />
                <StatusItem
                  label="Payouts enabled"
                  ok={payoutsEnabled}
                  detail={
                    payoutsEnabled
                      ? "Bank transfers active"
                      : "Complete Stripe setup to enable"
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Details submitted: </span>
                  <span className="text-muted-foreground">
                    {detailsSubmitted ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form action={startStripeOnboardingAction}>
                    <FormSubmitButton
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-medium text-white shadow hover:bg-blue-700"
                      label={
                        hasAccount
                          ? "Update bank details"
                          : "Connect bank account"
                      }
                      pendingLabel="Opening Stripe..."
                    />
                  </form>
                  {hasAccount && (
                    <form action={syncStripeStatusAction}>
                      <FormSubmitButton
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        label="Sync status"
                        pendingLabel="Syncing..."
                      />
                    </form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What happens next */}
          {!fullyConnected && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  What happens when you click &ldquo;
                  {hasAccount ? "Update bank details" : "Connect bank account"}
                  &rdquo;?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <StepItem
                    step={1}
                    title="Redirect to Stripe"
                    description="You will be redirected to a secure Stripe page. This is hosted by Stripe, not by us."
                  />
                  <StepItem
                    step={2}
                    title="Enter your bank details"
                    description="Stripe will ask for your sort code and account number (for UK bank accounts), plus basic identity verification."
                  />
                  <StepItem
                    step={3}
                    title="Identity verification"
                    description="Stripe may ask for a photo ID and a selfie to verify your identity. This is required by financial regulations."
                  />
                  <StepItem
                    step={4}
                    title="Return here"
                    description="Once complete, you will be redirected back to this page. Your status will update automatically."
                  />
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Fully connected success */}
          {fullyConnected && (
            <Card className="border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10">
              <CardContent className="flex items-center gap-3 pt-6">
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Your payment account is fully connected.
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    You can receive payouts for completed bookings. You can
                    update your bank details at any time using the button above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Info sidebar (1/3) */}
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                How payouts work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <InfoRow
                icon={<Building2 className="size-3.5 text-blue-600 shrink-0" />}
                text="Payouts are sent directly to your bank account by Stripe."
              />
              <InfoRow
                icon={<Clock className="size-3.5 text-blue-600 shrink-0" />}
                text="Payouts typically arrive within 2-3 business days after a booking is completed."
              />
              <InfoRow
                icon={
                  <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
                }
                text="Your bank details are stored securely by Stripe. We never see or store your account number."
              />
              <InfoRow
                icon={
                  <ExternalLink className="size-3.5 text-blue-600 shrink-0" />
                }
                text="The platform charges a 12% commission on each booking. This is deducted before your payout."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatusItem({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-lg border px-3 py-2.5 space-y-1">
      <div className="flex items-center gap-1.5">
        {ok ? (
          <CheckCircle2 className="size-3.5 text-green-600" />
        ) : (
          <Clock className="size-3.5 text-amber-500" />
        )}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function StepItem({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        {step}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}
