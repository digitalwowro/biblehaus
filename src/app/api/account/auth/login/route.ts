import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/admin";
import { createUserToken } from "@/lib/auth/user";
import { setUserSessionCookie } from "@/lib/auth/user-session";
import { success, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return error("Email and password are required", "VALIDATION_ERROR", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      isSuspended: true,
      maxApiKeys: true,
      _count: { select: { apiKeys: true } },
    },
  });

  if (!user || !user.passwordHash) {
    return error(
      "This account cannot sign in yet. Ask an administrator to set a password.",
      "LOGIN_DISABLED",
      401
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return error("Invalid email or password", "INVALID_CREDENTIALS", 401);
  }

  const token = await createUserToken({
    sub: user.id.toString(),
    email: user.email,
  });

  await setUserSessionCookie(token);

  return success({
    id: user.id,
    email: user.email,
    name: user.name,
    isSuspended: user.isSuspended,
    maxApiKeys: user.maxApiKeys,
    apiKeysCount: user._count.apiKeys,
  });
}
