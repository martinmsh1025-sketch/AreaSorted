import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { getAdminSession } from "@/lib/admin-auth";
import { adminLoginAction } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await getAdminSession();
  if (session) redirect("/admin/bookings");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const hasError = Boolean(error);

  const errorMessage =
    error === "not_provisioned"
      ? "This account does not have admin access."
      : "Incorrect email or password.";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-lg">Admin Sign In</CardTitle>
          <CardDescription>For internal team only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={adminLoginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@areasorted.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            {hasError && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            <FormSubmitButton label="Sign in" pendingLabel="Signing in..." className="w-full" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
