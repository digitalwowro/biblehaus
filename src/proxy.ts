import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/auth/jwt";

const COOKIE_NAME = "biblehaus_admin_token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      await jwtVerify(token, getJwtSecret());
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        },
        { status: 401 },
      );
    }
    try {
      await jwtVerify(token, getJwtSecret());
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
        },
        { status: 401 },
      );
    }
  }

  if (pathname.startsWith("/api/v1")) {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_API_KEY",
            message: "X-API-Key header is required",
          },
        },
        { status: 401 },
      );
    }
  }

  if (!request.cookies.get("biblehaus_locale")?.value) {
    const acceptLang = request.headers.get("accept-language") || "";
    const locale = acceptLang.toLowerCase().includes("ro") ? "ro" : "en";
    const response = NextResponse.next();
    response.cookies.set("biblehaus_locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/v1/:path*", "/", "/browse/:path*"],
};
