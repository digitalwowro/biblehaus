import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { validateApiKey, logRequest } from "@/lib/api/validate-key";

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = new URL(request.url);
  const version = searchParams.get("version");
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const verse = searchParams.get("verse"); // optional, supports ranges like "1-5"

  if (!version || !book || !chapter) {
    return error("'version', 'book', and 'chapter' parameters are required", "VALIDATION_ERROR", 400);
  }

  const versionRecord = await prisma.version.findFirst({
    where: { abbreviation: { equals: version, mode: "insensitive" }, isPublished: true },
  });

  if (!versionRecord) {
    return error("Version not found", "NOT_FOUND", 404);
  }

  const bookNumber = parseInt(book);
  const bookRecord = await prisma.book.findFirst({
    where: {
      versionId: versionRecord.id,
      ...(isNaN(bookNumber)
        ? { name: { equals: book, mode: "insensitive" } }
        : { bookNumber }),
    },
  });

  if (!bookRecord) {
    return error("Book not found", "NOT_FOUND", 404);
  }

  const chapterNumber = parseInt(chapter);
  if (isNaN(chapterNumber)) {
    return error("'chapter' must be a number", "VALIDATION_ERROR", 400);
  }

  const chapterRecord = await prisma.chapter.findFirst({
    where: { bookId: bookRecord.id, chapterNumber },
  });

  if (!chapterRecord) {
    return error("Chapter not found", "NOT_FOUND", 404);
  }

  // Build verse filter
  const verseWhere: Record<string, unknown> = { chapterId: chapterRecord.id };

  if (verse) {
    const rangeMatch = verse.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      verseWhere.verseNumber = { gte: start, lte: end };
    } else {
      const verseNum = parseInt(verse);
      if (isNaN(verseNum)) {
        return error("'verse' must be a number or range (e.g., '1-5')", "VALIDATION_ERROR", 400);
      }
      verseWhere.verseNumber = verseNum;
    }
  }

  const verses = await prisma.verse.findMany({
    where: verseWhere,
    orderBy: { verseNumber: "asc" },
    select: {
      id: true,
      verseNumber: true,
      text: true,
    },
  });

  const data = {
    version: versionRecord.abbreviation,
    book: bookRecord.name,
    chapter: chapterNumber,
    verses,
  };

  const res = success(data, { total: verses.length });

  logRequest(auth.apiKeyId!, "GET", "/api/v1/verses", 200, request.headers.get("x-forwarded-for"));

  return res;
}
