import Link from "next/link";
import { providerLoginAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, LogIn } from "lucide-react";

type ProviderLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderLoginPage({ searchParams }: ProviderLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const hasError = Boolean(error);
  const errorMessage = error === "invite_not_completed"
    ? "Your invite exists, but setup is not finished. Open your invite link, verify email, and create your password first."
    : error === "invalid_reset_token" || error === "invalid_setup_token"
      ? "This password link is invalid or has expired. Request a fresh password email to continue."
      : hasError
        ? "Incorrect email or password."
        : "";

  return (
    <div className="provider-auth-shell">
      <div className="provider-auth-panel provider-auth-grid">
        <div className="provider-auth-hero">
          <div className="provider-auth-eyebrow">
            <LogIn className="size-3.5" />
            AreaSorted provider portal
          </div>
          <h1 className="provider-auth-title">Turn availability, service coverage, and pricing into repeat work.</h1>
          <p className="provider-auth-copy">
            AreaSorted helps independent providers turn their setup into real bookings. Manage your service areas, availability, pricing, and payout status from one place.
          </p>
          <div className="provider-auth-aside">
            <div className="provider-auth-note">
              <strong>Why providers use AreaSorted</strong>
              Quote requests, booking confirmation, account setup, and payout visibility all stay in one structured portal.
            </div>
            <div className="provider-auth-note">
              <strong>New provider?</strong>
              Start with the public onboarding link, verify your email, and create your password before signing in.
            </div>
          </div>
        </div>

        <Card className="provider-auth-card">
          <CardHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-900/25">
              <LogIn className="size-5" />
            </div>
            <div>
              <CardTitle className="text-2xl tracking-tight">Sign in to your provider account</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Already onboarded? Use your provider email and password here.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <form action={providerLoginAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" placeholder="Password" required />
              </div>

              {hasError && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <FormSubmitButton
                label="Sign in"
                pendingLabel="Signing in..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm font-medium transition-colors"
              />
            </form>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-center dark:border-blue-900 dark:bg-blue-950/20">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Need to apply first?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the public provider onboarding link if you have not yet created your provider account.
                </p>
              </div>
              <a
                href="/provider/apply"
                className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
              >
                Apply now
                <ArrowRight className="ml-1.5 size-4" />
              </a>
            </div>
            <div className="text-center">
              <Link href="/provider/forgot-password" className="text-xs text-muted-foreground hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
