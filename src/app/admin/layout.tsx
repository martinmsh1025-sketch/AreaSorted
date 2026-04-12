import { getAdminSession } from "@/lib/admin-auth";
import { adminLogoutAction } from "@/app/admin/login/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n/context";
import { getAdminLocale } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const locale = await getAdminLocale();
  return (
    <I18nProvider initialLocale={locale}>
      <TooltipProvider>
        <AdminShell
          adminEmail={session?.email || null}
          logoutAction={adminLogoutAction}
        >
          {children}
        </AdminShell>
      </TooltipProvider>
    </I18nProvider>
  );
}
