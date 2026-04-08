import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!email || !password) {
    return error("Email and password are required", "VALIDATION_ERROR", 400);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return error(
      `Admin user with email "${email}" already exists`,
      "DUPLICATE",
      409
    );
  }

  const adminUser = await prisma.adminUser.create({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
    },
  });

  return success(adminUser);
}
