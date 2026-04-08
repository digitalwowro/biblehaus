import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserSession } from "@/lib/auth/user-session";
import { success, error } from "@/lib/api/response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const apiKeyId = parseInt(id);
  const userId = parseInt(session.sub);

  const existing = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { id: true, userId: true },
  });

  if (!existing || existing.userId !== userId) {
    return error("API key not found", "NOT_FOUND", 404);
  }

  await prisma.apiKey.delete({ where: { id: apiKeyId } });
  return success({ deleted: true });
}
