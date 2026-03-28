import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveEnabledServiceCategoriesAction, saveMarketplaceSettingAction } from "@/app/admin/pricing/actions";
import { BookingFeeForm } from "@/app/admin/pricing/booking-fee-form";
import { ALL_SERVICE_VALUES } from "@/lib/service-catalog-settings";
import { serviceCatalog } from "@/lib/service-catalog";

type AdminSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const query = (await searchParams) ?? {};
  const status = typeof query.status === "string" ? query.status : "";

  const [bookingFeeSetting, bookingFeeModeSetting, commissionSetting, enabledServicesSetting, opsEmailSetting, settings] =
    await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee_mode" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.commission_percent" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.enabled_service_categories" } }),
      prisma.adminSetting.findUnique({ where: { key: "marketplace.ops_notification_emails" } }),
      prisma.adminSetting.findMany({ orderBy: { key: "asc" } }),
    ]);

  const enabledServices = getSettingValue<string[]>(enabledServicesSetting, ALL_SERVICE_VALUES);
  const opsEmails = getSettingValue<string>(opsEmailSetting, process.env.SUPPORT_EMAIL || "support@areasorted.com");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and fee settings.
        </p>
      </div>

      {status === "service_visibility_saved" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Service visibility updated.
        </div>
      ) : null}

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
              currentMode={getSettingValue<string>(bookingFeeModeSetting, "fixed")}
              currentValue={getSettingValue<number>(bookingFeeSetting, 12)}
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
                    getSettingValue<number>(commissionSetting, 12),
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

      <Card>
        <CardHeader>
          <CardTitle>Ops notification emails</CardTitle>
          <CardDescription>
            Use a comma-separated list of internal emails for provider applications, booking alerts, and reminder notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveMarketplaceSettingAction} className="space-y-3 max-w-2xl">
            <input type="hidden" name="key" value="marketplace.ops_notification_emails" />
            <div>
              <Label htmlFor="opsEmails">Notification recipients</Label>
              <Input id="opsEmails" name="value" defaultValue={opsEmails} />
              <p className="text-xs text-muted-foreground mt-1">
                Example: ops@areasorted.com, founder@areasorted.com
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
            >
              Save notification emails
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Raw settings overview */}
      <Card>
        <CardHeader>
          <CardTitle>Live service categories</CardTitle>
          <CardDescription>
            Control which service categories are visible in the customer portal and public SEO pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveEnabledServiceCategoriesAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {serviceCatalog.map((service) => (
                <label key={service.value} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="enabledServices"
                    value={service.value}
                    defaultChecked={enabledServices.includes(service.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">{service.label}</div>
                    <p className="text-xs text-muted-foreground mt-1">{service.strapline}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
            >
              Save service visibility
            </button>
          </form>
        </CardContent>
      </Card>

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
