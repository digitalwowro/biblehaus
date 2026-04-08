import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { versions: true } } },
  });
  return success(languages);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, name, nativeName, direction } = body;

  if (!code || !name || !nativeName) {
    return error("Code, name, and native name are required", "VALIDATION_ERROR", 400);
  }

  const existing = await prisma.language.findUnique({ where: { code } });
  if (existing) {
    return error(`Language with code "${code}" already exists`, "DUPLICATE", 409);
  }

  const language = await prisma.language.create({
    data: { code, name, nativeName, direction: direction || "ltr" },
  });

  return success(language);
}
