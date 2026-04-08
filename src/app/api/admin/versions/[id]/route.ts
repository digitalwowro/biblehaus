import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { languageId, abbreviation, name, description, isPublished } = body;

  const version = await prisma.version.update({
    where: { id: parseInt(id) },
    data: {
      ...(languageId && { languageId: parseInt(languageId) }),
      ...(abbreviation && { abbreviation }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isPublished !== undefined && { isPublished }),
    },
    include: {
      language: { select: { id: true, code: true, name: true } },
    },
  });

  return success(version);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booksCount = await prisma.book.count({
    where: { versionId: parseInt(id) },
  });

  if (booksCount > 0) {
    return error(
      "Cannot delete a version that has books. Delete its books first.",
      "HAS_DEPENDENCIES",
      409
    );
  }

  await prisma.version.delete({ where: { id: parseInt(id) } });
  return success({ deleted: true });
}
