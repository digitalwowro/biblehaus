import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, createToken } from "@/lib/auth/admin";
import { setSessionCookie } from "@/lib/auth/session";
import { success, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return error("Email and password are required", "VALIDATION_ERROR", 400);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return error("Invalid email or password", "INVALID_CREDENTIALS", 401);
  }

  const token = await createToken({
    sub: admin.id.toString(),
    email: admin.email,
  });

  await setSessionCookie(token);

  return success({
    id: admin.id,
    email: admin.email,
    name: admin.name,
  });
}
