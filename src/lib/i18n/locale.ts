import { cookies } from "next/headers";
import { type Locale, locales, defaultLocale } from "./translations";

const COOKIE_NAME = "biblehaus_locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
}
