import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";

export default async function BrowsePage() {
  const locale = await getLocale();

  const languages = await prisma.language.findMany({
    where: { versions: { some: { isPublished: true } } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { versions: { where: { isPublished: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
        {t(locale, "browse.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        {t(locale, "browse.subtitle")}
      </p>

      {languages.length === 0 ? (
        <div className="mt-8 flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] text-sm text-[var(--ink-subtle)]">
          {t(locale, "browse.empty")}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => (
            <Link
              key={lang.id}
              href={`/browse/${lang.code.toLowerCase()}`}
              className="group rounded-2xl border border-[var(--line-soft)] bg-white p-5 transition hover:border-[var(--accent-strong)] hover:shadow-sm"
            >
              <p className="text-lg font-semibold text-[var(--ink-strong)] group-hover:text-[var(--accent-strong)]">
                {lang.name}
              </p>
              {lang.nativeName !== lang.name && (
                <p className="text-sm text-[var(--ink-muted)]">{lang.nativeName}</p>
              )}
              <p className="mt-2 text-xs text-[var(--ink-subtle)]">
                {lang._count.versions}{" "}
                {lang._count.versions === 1
                  ? t(locale, "browse.version")
                  : t(locale, "browse.versions")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
