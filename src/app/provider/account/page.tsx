import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { updateProviderProfileAction, updateProviderPasswordAction } from "./actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Shield,
  UserCircle2,
  Sparkles,
} from "lucide-react";
import { EditableProfileForm } from "@/components/provider/editable-profile-form";
import { parseProviderPublicProfileMetadata } from "@/lib/providers/public-profile-metadata";

type ProviderAccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderAccountPage({ searchParams }: ProviderAccountPageProps) {
  const session = await requireProviderAccountAccess();
  const provider = session.providerCompany;
  const publicProfileMetadata = parseProviderPublicProfileMetadata(provider.specialtiesText);
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
          <h1 className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
            <UserCircle2 className="size-5 text-[#c62828]" />
            My Profile
          </h1>
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
        profileImageUrl={provider.profileImageUrl ?? ""}
        profileImageType={provider.profileImageType ?? "logo"}
        headline={provider.headline ?? ""}
        bio={provider.bio ?? ""}
        yearsExperience={provider.yearsExperience != null ? String(provider.yearsExperience) : ""}
        contactEmail={provider.contactEmail}
        phone={provider.phone ?? ""}
        registeredAddress={provider.registeredAddress ?? ""}
        companyNumber={provider.companyNumber ?? ""}
        vatNumber={provider.vatNumber ?? ""}
        supportedContactChannels={publicProfileMetadata.supportedContactChannels.join(", ")}
        contactDetails={publicProfileMetadata.contactDetails}
        responseTimeLabel={publicProfileMetadata.responseTimeLabel ?? ""}
        serviceCommitments={publicProfileMetadata.serviceCommitments.join(", ")}
        languagesSpoken={publicProfileMetadata.languagesSpoken.join(", ")}
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
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <Shield className="size-4 text-[#c62828]" />
            Security
          </h2>
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
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-[#c62828]" />
            Quick Actions
          </h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <Link
            href="/provider/payment"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <CreditCard className="size-4" />
            Payment Account
          </Link>
          <Link
            href="/provider/preview"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            Preview profile
          </Link>
        </div>
      </div>
    </div>
  );
}
