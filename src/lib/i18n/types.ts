export type Locale = "en" | "zh-HK";

export const LOCALES: Locale[] = ["en", "zh-HK"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-HK": "繁體中文",
};

export const LOCALE_COOKIE = "admin-locale";
