import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { VerseList } from "@/components/bible/verse-list";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ lang: string; version: string; book: string; chapter: string }>;
}) {
  const { lang, version, book, chapter } = await params;
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

  const bookNumber = parseInt(book, 10);
  const bookRecord = await prisma.book.findFirst({
    where: {
      versionId: versionRecord.id,
      ...(isNaN(bookNumber)
        ? { name: { equals: book, mode: "insensitive" } }
        : { bookNumber }),
    },
  });

  if (!bookRecord) notFound();

  const chapterNumber = parseInt(chapter, 10);
  if (isNaN(chapterNumber)) notFound();

  const chapterRecord = await prisma.chapter.findFirst({
    where: { bookId: bookRecord.id, chapterNumber },
  });

  if (!chapterRecord) notFound();

  const verses = await prisma.verse.findMany({
    where: { chapterId: chapterRecord.id },
    orderBy: { verseNumber: "asc" },
  });

  const prevChapter = chapterNumber > 1 ? chapterNumber - 1 : null;
  const nextChapter =
    chapterNumber < bookRecord.totalChapters ? chapterNumber + 1 : null;

  const basePath = `/browse/${lang.toLowerCase()}/${version.toLowerCase()}/${book}`;

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--ink-muted)]">
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
        <span>
          {t(locale, bookRecord.testament === "OT" ? "version.ot" : "version.nt")}
        </span>
        <span>/</span>
        <Link
          href={basePath}
          className="transition hover:text-[var(--accent-strong)]"
        >
          {bookRecord.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--ink-strong)]">
          {t(locale, "chapter.prev")} {chapterNumber}
        </span>
      </nav>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
        {bookRecord.name} {chapterNumber}
      </h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {versionRecord.name} - {verses.length} {t(locale, "chapter.verses")}
      </p>

      <article className="mt-6 rounded-2xl border border-[var(--line-soft)] bg-white p-6 sm:p-8">
        <VerseList
          verses={verses.map((v) => ({
            id: Number(v.id),
            verseNumber: v.verseNumber,
            text: v.text,
          }))}
          bookName={bookRecord.name}
          chapterNumber={chapterNumber}
          basePath={basePath}
          version={versionRecord.abbreviation}
          bookNumber={bookRecord.bookNumber}
          ttsEnabled={process.env.TTS_ENABLED === "true"}
          locale={locale}
        />
      </article>

      <nav className="mt-6 flex items-center justify-between">
        {prevChapter ? (
          <Link
            href={`${basePath}/${prevChapter}`}
            className="rounded-xl border border-[var(--line-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
          >
            &larr; {t(locale, "chapter.prev")} {prevChapter}
          </Link>
        ) : (
          <div />
        )}
        {nextChapter ? (
          <Link
            href={`${basePath}/${nextChapter}`}
            className="rounded-xl border border-[var(--line-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
          >
            {t(locale, "chapter.next")} {nextChapter} &rarr;
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
