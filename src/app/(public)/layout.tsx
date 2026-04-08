import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <header className="border-b border-[var(--line-soft)] bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-[-0.03em] text-[var(--ink-strong)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-strong)] text-sm font-bold text-white">
              B
            </span>
            BibleHaus
          </Link>
          <LocaleSwitcher current={locale} />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
