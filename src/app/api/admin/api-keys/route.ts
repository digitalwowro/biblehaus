import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { requests: true } },
    },
  });
  return success(keys);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, name, domain } = body;

  if (!userId || !name || !domain) {
    return error("User, name, and domain are required", "VALIDATION_ERROR", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  if (!user) {
    return error("User not found", "NOT_FOUND", 404);
  }

  const rawKey = `bh_${randomBytes(30).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: parseInt(userId),
      key: rawKey,
      name,
      domain,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Return the raw key only on creation — it won't be shown again
  return success({ ...apiKey, rawKey });
}
