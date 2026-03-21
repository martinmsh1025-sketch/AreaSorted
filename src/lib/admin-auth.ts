import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { verifySessionValue } from "@/lib/security/session";

export const ADMIN_SESSION_COOKIE = "areasorted_admin_session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!raw) return null;

  const userId = verifySessionValue(raw);
  if (!userId) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user?.isActive) return null;
  const hasAdminRole = user.roles.some((assignment) => assignment.role.key === "ADMIN");
  if (!hasAdminRole) return null;

  return user;
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return Boolean(session);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
