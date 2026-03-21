import { notFound } from "next/navigation";
import { getProviderAuthToken } from "@/lib/providers/auth-tokens";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { setProviderPasswordAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from "lucide-react";

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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Lock className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            {mode === "reset" ? "Reset your password" : "Create your password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "reset"
              ? "Choose a new password to get back into the provider portal."
              : "Set your password to unlock provider login and continue onboarding."}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form action={setProviderPasswordAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="mode" value={mode} />
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" name="confirmPassword" placeholder="Re-enter password" autoComplete="new-password" required />
              </div>

              <p className="text-xs text-muted-foreground">Use at least 8 characters with letters and numbers.</p>

              {error === "password_too_short" && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Use at least 8 characters.</span>
                </div>
              )}
              {error === "password_mismatch" && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Passwords do not match.</span>
                </div>
              )}

              <FormSubmitButton
                label={mode === "reset" ? "Save new password" : "Create password"}
                pendingLabel="Saving..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm font-medium transition-colors"
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
