import { getAdminSession } from "@/lib/admin-auth";
import { adminLogoutAction } from "@/app/admin/login/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  return (
    <TooltipProvider>
      <AdminShell
        adminEmail={session?.email || null}
        logoutAction={adminLogoutAction}
      >
        {children}
      </AdminShell>
    </TooltipProvider>
  );
}
