import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, email } = body;

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
  });

  return success(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const keysCount = await prisma.apiKey.count({
    where: { userId: parseInt(id) },
  });

  if (keysCount > 0) {
    return error(
      "Cannot delete a user that has API keys. Delete their keys first.",
      "HAS_DEPENDENCIES",
      409
    );
  }

  await prisma.user.delete({ where: { id: parseInt(id) } });
  return success({ deleted: true });
}
