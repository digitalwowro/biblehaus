import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getUserSession } from "@/lib/auth/user-session";
import { BrandLogo } from "@/components/brand/logo";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const userSession = await getUserSession();

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <header className="border-b border-[var(--line-soft)] bg-white">
        <div className="mx-auto flex min-h-[4.5rem] max-w-4xl items-center justify-between px-5 py-3">
          <BrandLogo href="/" size="header" priority />
          <div className="flex items-center gap-3">
            <Link
              href={userSession ? "/account" : "/login"}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
            >
              {userSession ? t(locale, "nav.my_account") : t(locale, "nav.login")}
            </Link>
            <LocaleSwitcher current={locale} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
