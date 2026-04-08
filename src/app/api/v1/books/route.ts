import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { validateApiKey, logRequest } from "@/lib/api/validate-key";

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = new URL(request.url);
  const version = searchParams.get("version");

  if (!version) {
    return error("'version' parameter is required (abbreviation)", "VALIDATION_ERROR", 400);
  }

  const versionRecord = await prisma.version.findFirst({
    where: { abbreviation: { equals: version, mode: "insensitive" }, isPublished: true },
  });

  if (!versionRecord) {
    return error("Version not found", "NOT_FOUND", 404);
  }

  const books = await prisma.book.findMany({
    where: { versionId: versionRecord.id },
    orderBy: { bookNumber: "asc" },
    select: {
      id: true,
      bookNumber: true,
      name: true,
      abbreviation: true,
      testament: true,
      totalChapters: true,
    },
  });

  const res = success(books, { total: books.length });

  logRequest(auth.apiKeyId!, "GET", "/api/v1/books", 200, request.headers.get("x-forwarded-for"));

  return res;
}
