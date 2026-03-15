import { cookies } from "next/headers";

export const PROVIDER_SESSION_COOKIE = "areasorted_provider_session";

export async function getProviderSessionCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get(PROVIDER_SESSION_COOKIE)?.value || null;
}

export async function isProviderAuthenticated() {
  return Boolean(await getProviderSessionCompanyId());
}
