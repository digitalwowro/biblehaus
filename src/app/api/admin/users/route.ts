import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  const [users, adminUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        maxApiKeys: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { apiKeys: true } },
      },
    }),
    prisma.adminUser.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
  ]);

  return success({
    users,
    adminUsers,
    currentAdminId: session ? parseInt(session.sub) : null,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, maxApiKeys } = body;

  if (!name || !email) {
    return error("Name and email are required", "VALIDATION_ERROR", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return error(`User with email "${email}" already exists`, "DUPLICATE", 409);
  }

  const user = await prisma.user.create({
    select: {
      id: true,
      name: true,
      email: true,
      maxApiKeys: true,
      isSuspended: true,
      createdAt: true,
    },
    data: {
      name,
      email,
      ...(maxApiKeys !== undefined && maxApiKeys !== null && maxApiKeys !== ""
        ? { maxApiKeys: Number(maxApiKeys) }
        : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  return success(user);
}
