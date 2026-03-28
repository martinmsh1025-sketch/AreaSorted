import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { updateProviderProfileAction, updateProviderPasswordAction } from "./actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
} from "lucide-react";
import { EditableProfileForm } from "@/components/provider/editable-profile-form";

type ProviderAccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderAccountPage({ searchParams }: ProviderAccountPageProps) {
  const session = await requireProviderAccountAccess();
  const provider = session.providerCompany;
  const params = (await searchParams) ?? {};
  const passwordStatus = typeof params.passwordStatus === "string" ? params.passwordStatus : "";
  const passwordError = typeof params.passwordError === "string" ? params.passwordError : "";

  // Format dates
  const memberSince = provider.createdAt
    ? new Date(provider.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const approvedAt = provider.approvedAt
    ? new Date(provider.approvedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company details and account settings.
          </p>
        </div>
        <Badge
          variant={provider.status === "ACTIVE" ? "default" : "outline"}
          className={
            provider.status === "ACTIVE"
              ? "bg-green-600"
              : ""
          }
        >
          {provider.status}
        </Badge>
      </div>

      {/* Editable profile form */}
      <EditableProfileForm
        tradingName={provider.tradingName ?? ""}
        contactEmail={provider.contactEmail}
        phone={provider.phone ?? ""}
        registeredAddress={provider.registeredAddress ?? ""}
        companyNumber={provider.companyNumber ?? ""}
        vatNumber={provider.vatNumber ?? ""}
        legalName={provider.legalName ?? ""}
        memberSince={memberSince}
        approvedAt={approvedAt}
        updateAction={updateProviderProfileAction}
      />

      {(passwordStatus || passwordError) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${passwordError ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300" : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300"}`}>
          {passwordError || passwordStatus}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Security</h2>
          <p className="text-xs text-muted-foreground mt-1">Update your password without leaving the provider portal.</p>
        </div>
        <div className="p-4">
          <form action={updateProviderPasswordAction} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <div className="md:col-span-3">
              <FormSubmitButton label="Update password" pendingLabel="Updating..." className="h-9 text-sm" />
            </div>
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <Link
            href="/provider/payment"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <CreditCard className="size-4" />
            Payment Account
          </Link>
        </div>
      </div>
    </div>
  );
}
