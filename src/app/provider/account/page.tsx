import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { providerLogoutAction } from "@/app/provider/login/actions";
import { updateProviderProfileAction } from "./actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Receipt,
  Shield,
  KeyRound,
  CreditCard,
  LogOut,
  Calendar,
} from "lucide-react";
import { EditableProfileForm } from "@/components/provider/editable-profile-form";

export default async function ProviderAccountPage() {
  const session = await requireProviderAccountAccess();
  const provider = session.providerCompany;
  const displayName =
    provider.tradingName || provider.legalName || "Provider account";

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

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <Link
            href="/provider/forgot-password"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <KeyRound className="size-4" />
            Change Password
          </Link>
          <Link
            href="/provider/payment"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <CreditCard className="size-4" />
            Payment Account
          </Link>
          <form action={providerLogoutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
