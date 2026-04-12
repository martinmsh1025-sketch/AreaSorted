import { cookies } from "next/headers";
import { LOCALE_COOKIE, DEFAULT_LOCALE, getTranslations } from "./index";
import type { Locale, TranslationKeys } from "./index";

/**
 * Read the admin locale from cookies (server-side only).
 */
export async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value === "zh-HK" || value === "en") return value;
  return DEFAULT_LOCALE;
}

/**
 * Get translations for the current admin locale (server-side only).
 */
export async function getAdminTranslations(): Promise<TranslationKeys> {
  const locale = await getAdminLocale();
  return getTranslations(locale);
}
