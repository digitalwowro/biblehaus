import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

export class ApiKeyCreationError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

export async function createApiKeyForUser(
  userId: number,
  name: string,
  domain: string,
  options?: { allowWhileSuspended?: boolean }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isSuspended: true,
      maxApiKeys: true,
    },
  });

  if (!user) {
    throw new ApiKeyCreationError("User not found", "NOT_FOUND", 404);
  }

  if (user.maxApiKeys !== null) {
    const keysCount = await prisma.apiKey.count({ where: { userId } });
    if (keysCount >= user.maxApiKeys) {
      throw new ApiKeyCreationError(
        `This user has reached the maximum of ${user.maxApiKeys} API keys.`,
        "API_KEY_LIMIT_REACHED",
        409
      );
    }
  }

  if (user.isSuspended && !options?.allowWhileSuspended) {
    throw new ApiKeyCreationError(
      "Your account is suspended. Contact an administrator for access.",
      "USER_SUSPENDED",
      403
    );
  }

  const rawKey = `bh_${randomBytes(30).toString("hex")}`;
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      key: rawKey,
      name,
      domain,
      isActive: !user.isSuspended,
      wasActiveBeforeSuspension: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { requests: true } },
    },
  });

  return { apiKey, rawKey, user };
}
