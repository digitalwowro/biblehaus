import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";

export default async function BookPage({
  params,
}: {
  params: Promise<{ lang: string; version: string; book: string }>;
}) {
  const { lang, version, book } = await params;
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

  const bookNumber = parseInt(book);
  const bookRecord = await prisma.book.findFirst({
    where: {
      versionId: versionRecord.id,
      ...(isNaN(bookNumber)
        ? { name: { equals: book, mode: "insensitive" } }
        : { bookNumber }),
    },
  });

  if (!bookRecord) notFound();

  const chapters = await prisma.chapter.findMany({
    where: { bookId: bookRecord.id },
    orderBy: { chapterNumber: "asc" },
  });

  const basePath = `/browse/${lang.toLowerCase()}/${version.toLowerCase()}/${book}`;

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
        <Link
          href={`/browse/${lang.toLowerCase()}/${version.toLowerCase()}`}
          className="transition hover:text-[var(--accent-strong)]"
        >
          {versionRecord.name}
        </Link>
        <span>/</span>
        <span className="text-[var(--ink-muted)]">
          {bookRecord.testament === "OT"
            ? t(locale, "version.ot")
            : t(locale, "version.nt")}
        </span>
        <span>/</span>
        <span className="font-medium text-[var(--ink-strong)]">
          {bookRecord.name}
        </span>
      </nav>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
        {bookRecord.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {versionRecord.name} · {chapters.length} {t(locale, "book.chapters")}
      </p>

      <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`${basePath}/${ch.chapterNumber}`}
            className="flex h-12 items-center justify-center rounded-xl border border-[var(--line-soft)] bg-white text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)] hover:shadow-sm"
          >
            {ch.chapterNumber}
          </Link>
        ))}
      </div>
    </div>
  );
}
