import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";

export default async function LanguagePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = await getLocale();

  const language = await prisma.language.findFirst({
    where: { code: { equals: lang, mode: "insensitive" } },
  });

  if (!language) notFound();

  const versions = await prisma.version.findMany({
    where: { languageId: language.id, isPublished: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });

  return (
    <div>
      <Link
        href="/browse"
        className="text-sm text-[var(--ink-muted)] transition hover:text-[var(--accent-strong)]"
      >
        &larr; {t(locale, "lang.back")}
      </Link>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
        {language.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {versions.length}{" "}
        {versions.length === 1
          ? t(locale, "browse.version")
          : t(locale, "browse.versions")}{" "}
        {t(locale, "lang.available")}
      </p>

      {versions.length === 0 ? (
        <div className="mt-8 flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] text-sm text-[var(--ink-subtle)]">
          {t(locale, "lang.empty")}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/browse/${lang.toLowerCase()}/${v.abbreviation.toLowerCase()}`}
              className="group rounded-2xl border border-[var(--line-soft)] bg-white p-5 transition hover:border-[var(--accent-strong)] hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-[var(--line-strong)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-muted)]">
                  {v.abbreviation}
                </span>
                <p className="text-lg font-semibold text-[var(--ink-strong)] group-hover:text-[var(--accent-strong)]">
                  {v.name}
                </p>
              </div>
              {v.description && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {v.description}
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--ink-subtle)]">
                {v._count.books} {t(locale, "lang.books")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
