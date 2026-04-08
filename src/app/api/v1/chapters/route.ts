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

  if (!version || !book) {
    return error("'version' and 'book' parameters are required", "VALIDATION_ERROR", 400);
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

  const chapters = await prisma.chapter.findMany({
    where: { bookId: bookRecord.id },
    orderBy: { chapterNumber: "asc" },
    select: {
      id: true,
      chapterNumber: true,
      totalVerses: true,
    },
  });

  const res = success(chapters, { total: chapters.length });

  logRequest(auth.apiKeyId!, "GET", "/api/v1/chapters", 200, request.headers.get("x-forwarded-for"));

  return res;
}
