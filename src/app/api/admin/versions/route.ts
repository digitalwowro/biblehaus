import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const versions = await prisma.version.findMany({
    orderBy: { name: "asc" },
    include: {
      language: { select: { id: true, code: true, name: true } },
      _count: { select: { books: true } },
    },
  });
  return success(versions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { languageId, abbreviation, name, description, isPublished } = body;

  if (!languageId || !abbreviation || !name) {
    return error("Language, abbreviation, and name are required", "VALIDATION_ERROR", 400);
  }

  const existing = await prisma.version.findUnique({ where: { abbreviation } });
  if (existing) {
    return error(`Version with abbreviation "${abbreviation}" already exists`, "DUPLICATE", 409);
  }

  const version = await prisma.version.create({
    data: {
      languageId: parseInt(languageId),
      abbreviation,
      name,
      description: description || null,
      isPublished: isPublished ?? false,
    },
    include: {
      language: { select: { id: true, code: true, name: true } },
    },
  });

  return success(version);
}
