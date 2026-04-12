import en from "./en";
import zhHK from "./zh-hk";
import type { Locale } from "./types";
import type { TranslationKeys } from "./en";

const translations: Record<Locale, TranslationKeys> = {
  en,
  "zh-HK": zhHK,
};

/**
 * Get the full translation object for a locale.
 * Works in both server and client contexts.
 */
export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations.en;
}

// Re-export everything from types for convenience
export { type Locale, LOCALES, DEFAULT_LOCALE, LOCALE_LABELS, LOCALE_COOKIE } from "./types";
export type { TranslationKeys } from "./en";
