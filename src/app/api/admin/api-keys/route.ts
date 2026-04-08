import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { createApiKeyForUser, ApiKeyCreationError } from "@/lib/api-keys";

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

  try {
    const { apiKey, rawKey } = await createApiKeyForUser(
      parseInt(userId),
      name,
      domain,
      { allowWhileSuspended: true }
    );

    return success({ ...apiKey, rawKey });
  } catch (err) {
    if (err instanceof ApiKeyCreationError) {
      return error(err.message, err.code, err.status);
    }

    throw err;
  }
}
