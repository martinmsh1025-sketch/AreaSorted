import Link from "next/link";
import { startPublicProviderApplicationAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent } from "@/components/ui/card";

type ProviderApplyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderApplyPage({ searchParams }: ProviderApplyPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <div className="provider-auth-shell">
      <div className="provider-auth-panel provider-auth-grid">
        <div className="provider-auth-hero">
          <div className="provider-auth-eyebrow">Provider application</div>
          <h1 className="provider-auth-title">Apply to join AreaSorted.</h1>
          <p className="provider-auth-copy">
            Enter your email to start onboarding. We verify it before you complete your profile, services, coverage, and documents.
          </p>
          <div className="provider-auth-note">
            <strong>What happens next</strong>
            Verify email, add business details, submit for review.
          </div>
          <div className="provider-auth-note">
            <strong>Plans at launch</strong>
            Approved providers can start on the <strong>GBP 0 Starter plan</strong>. Optional growth support can be discussed after approval.
          </div>
          <div className="provider-auth-note">
            <strong>Important</strong>
            Paid promotion never guarantees bookings. Results depend on fit, area, pricing, and responsiveness.
          </div>
        </div>

        <Card className="provider-auth-card">
          <CardContent className="p-6">
            <form action={startPublicProviderApplicationAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="contactEmail" className="text-sm font-medium">Contact email</label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                />
              </div>

              {error ? <p className="text-sm text-red-600">Please enter a valid email address.</p> : null}

              <FormSubmitButton
                label="Continue with email verification"
                pendingLabel="Preparing verification..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-10 px-4 text-sm font-medium transition-colors"
              />
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Already started before? Use your invite link or <Link href="/provider/login" className="text-primary hover:underline">sign in here</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
