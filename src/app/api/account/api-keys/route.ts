import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserSession } from "@/lib/auth/user-session";
import { createApiKeyForUser, ApiKeyCreationError } from "@/lib/api-keys";
import { success, error } from "@/lib/api/response";

function buildLimitMeta(maxApiKeys: number | null, totalKeys: number) {
  return {
    maxApiKeys,
    totalKeys,
    remainingKeys: maxApiKeys === null ? null : Math.max(maxApiKeys - totalKeys, 0),
  };
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const userId = parseInt(session.sub);
  const [user, keys] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        maxApiKeys: true,
        isSuspended: true,
      },
    }),
    prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { requests: true } },
      },
    }),
  ]);

  if (!user) {
    return error("User not found", "NOT_FOUND", 404);
  }

  return success({
    user,
    keys,
    ...buildLimitMeta(user.maxApiKeys, keys.length),
  });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const body = await request.json();
  const { name, domain } = body;

  if (!name || !domain) {
    return error("Name and domain are required", "VALIDATION_ERROR", 400);
  }

  try {
    const { apiKey, rawKey, user } = await createApiKeyForUser(
      parseInt(session.sub),
      name,
      domain
    );

    const totalKeys = await prisma.apiKey.count({ where: { userId: user.id } });

    return success({
      ...apiKey,
      rawKey,
      ...buildLimitMeta(user.maxApiKeys, totalKeys),
    });
  } catch (err) {
    if (err instanceof ApiKeyCreationError) {
      return error(err.message, err.code, err.status);
    }

    throw err;
  }
}
