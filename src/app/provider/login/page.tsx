import Link from "next/link";
import { providerLoginAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn } from "lucide-react";

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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LogIn className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Provider sign in</h1>
          <p className="text-sm text-muted-foreground">Use the email and password linked to your invite.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">First time here?</p>
            <ol className="space-y-1 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="font-semibold text-foreground">1.</span> Open your invite link</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">2.</span> Verify your email</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">3.</span> Create your password</li>
            </ol>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" size="sm" render={<Link href="/provider/forgot-password" />} className="text-xs text-muted-foreground">
            Forgot your password?
          </Button>
        </div>
      </div>
    </div>
  );
}
