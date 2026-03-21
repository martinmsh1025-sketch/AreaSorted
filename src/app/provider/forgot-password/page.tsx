import Link from "next/link";
import { requestProviderPasswordResetAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, KeyRound } from "lucide-react";

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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <KeyRound className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">Enter your provider email and we will send a reset link.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form action={requestProviderPasswordResetAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Provider email</Label>
                <Input id="email" type="email" name="email" placeholder="you@company.com" required />
              </div>

              {hasError && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Enter the email address linked to your provider account.</span>
                </div>
              )}

              {setupRequired && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>This provider has not finished invite setup. Complete email verification and first password setup from the invite flow.</span>
                </div>
              )}

              {sent && (
                <div className="flex items-start gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-300">
                  <CheckCircle className="mt-0.5 size-4 shrink-0" />
                  <span>If the account exists, a reset link is ready.</span>
                </div>
              )}

              {devLink && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground break-all">
                  Dev reset link: <a href={devLink} className="text-blue-600 underline">{devLink}</a>
                </div>
              )}

              <FormSubmitButton
                label="Send reset link"
                pendingLabel="Preparing..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm font-medium transition-colors"
              />
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" size="sm" render={<Link href="/provider/login" />} className="text-xs text-muted-foreground">
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
