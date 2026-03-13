import { cookies } from "next/headers";

export const CLEANER_SESSION_COOKIE = "washhub_cleaner_email";

export async function getAuthenticatedCleanerEmail() {
  const cookieStore = await cookies();
  return cookieStore.get(CLEANER_SESSION_COOKIE)?.value || "";
}

export async function isCleanerAuthenticated() {
  return Boolean(await getAuthenticatedCleanerEmail());
}
