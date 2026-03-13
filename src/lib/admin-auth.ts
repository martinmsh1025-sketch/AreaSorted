import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "washhub_admin_session";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === "authenticated";
}
