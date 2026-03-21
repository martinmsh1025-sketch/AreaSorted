import { cookies } from "next/headers";
import { getCleanerApplicationByEmail } from "@/lib/cleaner-application-store";
import { getCleanerRecordByEmail } from "@/lib/cleaner-record-store";

export const CLEANER_SESSION_COOKIE = "areasorted_cleaner_email";

export async function getAuthenticatedCleanerEmail() {
  const cookieStore = await cookies();
  return cookieStore.get(CLEANER_SESSION_COOKIE)?.value || "";
}

export async function isCleanerAuthenticated() {
  return Boolean(await getAuthenticatedCleanerEmail());
}

export async function getCleanerPortalRoute(email: string) {
  const cleanerRecord = await getCleanerRecordByEmail(email);
  if (cleanerRecord) {
    return "/cleaner/jobs";
  }

  const application = await getCleanerApplicationByEmail(email);
  if (application) {
    return "/cleaner/application-status";
  }

  return "/cleaner/login?error=1";
}
