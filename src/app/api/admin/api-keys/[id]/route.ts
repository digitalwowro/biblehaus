import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, domain, isActive } = body;

  const apiKey = await prisma.apiKey.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(domain && { domain }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return success(apiKey);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.apiKey.delete({ where: { id: parseInt(id) } });
  return success({ deleted: true });
}
