import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";

export default async function VersionPage({
  params,
}: {
  params: Promise<{ lang: string; version: string }>;
}) {
  const { lang, version } = await params;
  const locale = await getLocale();

  const versionRecord = await prisma.version.findFirst({
    where: {
      abbreviation: { equals: version, mode: "insensitive" },
      isPublished: true,
      language: { code: { equals: lang, mode: "insensitive" } },
    },
    include: { language: true },
  });

  if (!versionRecord) notFound();

  const books = await prisma.book.findMany({
    where: { versionId: versionRecord.id },
    orderBy: { bookNumber: "asc" },
  });

  const otBooks = books.filter((b) => b.testament === "OT");
  const ntBooks = books.filter((b) => b.testament === "NT");
  const basePath = `/browse/${lang.toLowerCase()}/${version.toLowerCase()}`;

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--ink-muted)]">
        <Link
          href="/browse"
          className="transition hover:text-[var(--accent-strong)]"
        >
          {t(locale, "browse.title")}
        </Link>
        <span>/</span>
        <Link
          href={`/browse/${lang.toLowerCase()}`}
          className="transition hover:text-[var(--accent-strong)]"
        >
          {versionRecord.language.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--ink-strong)]">
          {versionRecord.name}
        </span>
      </nav>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
        {versionRecord.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {versionRecord.abbreviation} · {books.length} {t(locale, "version.books")}
      </p>

      {books.length === 0 ? (
        <div className="mt-8 flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] text-sm text-[var(--ink-subtle)]">
          {t(locale, "version.empty")}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {otBooks.length > 0 && (
            <BookSection
              title={`${t(locale, "version.ot")} (${otBooks.length})`}
              books={otBooks}
              basePath={basePath}
            />
          )}
          {ntBooks.length > 0 && (
            <BookSection
              title={`${t(locale, "version.nt")} (${ntBooks.length})`}
              books={ntBooks}
              basePath={basePath}
            />
          )}
        </div>
      )}
    </div>
  );
}

function BookSection({
  title,
  books,
  basePath,
}: {
  title: string;
  books: { bookNumber: number; name: string; abbreviation: string | null; totalChapters: number }[];
  basePath: string;
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
        {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((b) => (
          <Link
            key={b.bookNumber}
            href={`${basePath}/${b.bookNumber}`}
            className="group flex items-center gap-3 rounded-xl border border-[var(--line-soft)] bg-white px-4 py-3 transition hover:border-[var(--accent-strong)] hover:shadow-sm"
          >
            <span className="text-xs font-semibold text-[var(--ink-subtle)]">{b.bookNumber}</span>
            <span className="text-sm font-medium text-[var(--ink-strong)] group-hover:text-[var(--accent-strong)]">
              {b.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
