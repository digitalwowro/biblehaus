import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { validateApiKey, logRequest } from "@/lib/api/validate-key";

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  const where: Record<string, unknown> = { isPublished: true };

  if (lang) {
    const language = await prisma.language.findFirst({
      where: { code: { equals: lang, mode: "insensitive" } },
    });
    if (!language) {
      return error("Language not found", "NOT_FOUND", 404);
    }
    where.languageId = language.id;
  }

  const versions = await prisma.version.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      language: { select: { code: true, name: true } },
      _count: { select: { books: true } },
    },
  });

  const data = versions.map((v) => ({
    id: v.id,
    abbreviation: v.abbreviation,
    name: v.name,
    description: v.description,
    language: v.language,
    bookCount: v._count.books,
  }));

  const res = success(data, { total: data.length });

  logRequest(auth.apiKeyId!, "GET", "/api/v1/versions", 200, request.headers.get("x-forwarded-for"));

  return res;
}
