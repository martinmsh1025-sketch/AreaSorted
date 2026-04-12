"use client";

import * as React from "react";
import { getTranslations, DEFAULT_LOCALE, LOCALE_COOKIE } from "./index";
import type { Locale, TranslationKeys } from "./index";

interface I18nContextValue {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

/**
 * Provider that wraps admin pages to supply translation context.
 * Reads initial locale from a cookie, and persists changes back to the cookie.
 */
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const t = React.useMemo(() => getTranslations(locale), [locale]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to cookie so server components can read it too
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/admin;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    // Refresh to apply to server components
    window.location.reload();
  }, []);

  const value = React.useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access translations in client components.
 */
export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider>");
  }
  return ctx;
}

/**
 * Convenience hook that returns just the translation object.
 */
export function useT(): TranslationKeys {
  return useI18n().t;
}
