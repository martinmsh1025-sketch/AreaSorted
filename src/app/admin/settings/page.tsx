import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const settings = await prisma.adminSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace settings</h1>
        <p className="text-muted-foreground">
          Platform configuration loaded from the database.
        </p>
      </div>

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
