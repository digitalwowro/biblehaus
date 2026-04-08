import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const version = await prisma.version.findUnique({
    where: { id: parseInt(id) },
    include: {
      language: { select: { name: true, code: true } },
    },
  });

  if (!version) {
    return error("Version not found", "NOT_FOUND", 404);
  }

  const books = await prisma.book.findMany({
    where: { versionId: parseInt(id) },
    orderBy: { bookNumber: "asc" },
    include: { _count: { select: { chapters: true } } },
  });

  return success({ version, books });
}
