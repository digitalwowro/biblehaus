import { prisma } from "@/lib/db/prisma";
import { success } from "@/lib/api/response";

export async function GET() {
  const [languages, versions, books, verses, users, apiKeys, requests] =
    await Promise.all([
      prisma.language.count(),
      prisma.version.count(),
      prisma.book.count(),
      prisma.verse.count(),
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.apiRequestLog.count(),
    ]);

  return success({
    languages,
    versions,
    books,
    verses,
    users,
    apiKeys,
    requests,
  });
}
