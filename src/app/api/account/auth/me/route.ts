import { prisma } from "@/lib/db/prisma";
import { getUserSession } from "@/lib/auth/user-session";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.sub) },
    select: {
      id: true,
      email: true,
      name: true,
      maxApiKeys: true,
      isSuspended: true,
      _count: { select: { apiKeys: true } },
    },
  });

  if (!user) {
    return error("User not found", "NOT_FOUND", 404);
  }

  return success({
    ...user,
    apiKeysCount: user._count.apiKeys,
  });
}
