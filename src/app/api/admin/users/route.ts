import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { apiKeys: true } } },
  });
  return success(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return error("Name and email are required", "VALIDATION_ERROR", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return error(`User with email "${email}" already exists`, "DUPLICATE", 409);
  }

  const user = await prisma.user.create({
    data: { name, email },
  });

  return success(user);
}
