import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/lib/i18n/translations";

const COOKIE_NAME = "biblehaus_locale";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const locale = body?.locale as Locale | undefined;

  if (!locale || !locales.includes(locale)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid locale" } },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
