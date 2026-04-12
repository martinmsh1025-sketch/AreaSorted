import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminTranslations } from "@/lib/i18n/server";
import { adminLoginAction } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await getAdminSession();
  if (session) redirect("/admin/orders");

  const t = await getAdminTranslations();

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const hasError = Boolean(error);

  const errorMessage =
    error === "not_provisioned"
      ? t.login.noAdminAccess
      : t.login.incorrectCredentials;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-lg">{t.login.title}</CardTitle>
          <CardDescription>{t.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={adminLoginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.login.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder={t.login.emailPlaceholder}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.login.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder={t.login.passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </div>
            {hasError && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            <FormSubmitButton label={t.login.signIn} pendingLabel={t.login.signingIn} className="w-full" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
