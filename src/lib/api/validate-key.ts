import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { error } from "@/lib/api/response";

// In-memory rate limit tracking (per key, resets every minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { valid: false, response: error("X-API-Key header is required", "MISSING_API_KEY", 401) };
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  });

  if (!key) {
    return { valid: false, response: error("Invalid API key", "INVALID_API_KEY", 401) };
  }

  if (!key.isActive) {
    return { valid: false, response: error("API key is inactive", "INACTIVE_API_KEY", 403) };
  }

  // Rate limiting
  const now = Date.now();
  const limit = rateLimitMap.get(apiKey);

  if (limit && now < limit.resetAt) {
    if (limit.count >= key.rateLimit) {
      return { valid: false, response: error("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429) };
    }
    limit.count++;
  } else {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + 60_000 });
  }

  // Update last used (fire and forget)
  prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { valid: true, apiKeyId: key.id };
}

export async function logRequest(
  apiKeyId: number | null,
  method: string,
  path: string,
  statusCode: number,
  ipAddress: string | null
) {
  try {
    await prisma.apiRequestLog.create({
      data: {
        apiKeyId,
        method,
        path,
        statusCode,
        ipAddress,
      },
    });
  } catch {
    // Non-critical — don't fail the request
  }
}
