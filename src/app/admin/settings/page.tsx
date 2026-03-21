import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveMarketplaceSettingAction } from "@/app/admin/pricing/actions";
import { BookingFeeForm } from "@/app/admin/pricing/booking-fee-form";

export default async function AdminSettingsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();

  const [bookingFeeSetting, bookingFeeModeSetting, commissionSetting, settings] =
    await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee_mode" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.commission_percent" } }),
      prisma.adminSetting.findMany({ orderBy: { key: "asc" } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and fee settings.
        </p>
      </div>

      {/* Platform fee settings */}
      <Card>
        <CardHeader>
          <CardTitle>Platform fee settings</CardTitle>
          <CardDescription>
            Default booking fee and commission applied to all bookings unless overridden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <BookingFeeForm
              currentMode={((bookingFeeModeSetting?.valueJson as any)?.value as string) || "fixed"}
              currentValue={(bookingFeeSetting?.valueJson as any)?.value ?? 12}
              saveAction={saveMarketplaceSettingAction}
            />
            <form action={saveMarketplaceSettingAction} className="space-y-3">
              <input type="hidden" name="key" value="marketplace.commission_percent" />
              <div>
                <Label htmlFor="commissionPercent">Default commission percent (%)</Label>
                <Input
                  id="commissionPercent"
                  type="number"
                  step="0.01"
                  name="value"
                  defaultValue={String(
                    (commissionSetting?.valueJson as any)?.value ?? 12,
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Commission charged to the customer on top of the provider&apos;s price (e.g. 12 = 12%).
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
              >
                Save commission
              </button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Raw settings overview */}
      <Card>
        <CardHeader>
          <CardTitle>All settings</CardTitle>
          <CardDescription>{settings.length} keys configured</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length > 0 ? (
            <div className="space-y-2">
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">{setting.key}</span>
                  <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {JSON.stringify(setting.valueJson)}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No settings configured yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
