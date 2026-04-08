import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, domain, isActive, regenerate } = body;

  const existingKey = await prisma.apiKey.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      user: {
        select: {
          isSuspended: true,
        },
      },
    },
  });

  if (!existingKey) {
    return error("API key not found", "NOT_FOUND", 404);
  }

  if (existingKey.user.isSuspended && isActive === true) {
    return error(
      "Cannot activate API keys for suspended users.",
      "USER_SUSPENDED",
      409
    );
  }

  const nextKey = regenerate
    ? `bh_${randomBytes(30).toString("hex")}`
    : undefined;

  const apiKey = await prisma.apiKey.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(domain && { domain }),
      ...(isActive !== undefined && { isActive }),
      ...(nextKey && { key: nextKey }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return success({
    ...apiKey,
    ...(nextKey ? { rawKey: nextKey } : {}),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.apiKey.delete({ where: { id: parseInt(id) } });
  return success({ deleted: true });
}
