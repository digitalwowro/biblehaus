import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { code, name, nativeName, direction } = body;

  const language = await prisma.language.update({
    where: { id: parseInt(id) },
    data: {
      ...(code && { code }),
      ...(name && { name }),
      ...(nativeName && { nativeName }),
      ...(direction && { direction }),
    },
  });

  return success(language);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const versionsCount = await prisma.version.count({
    where: { languageId: parseInt(id) },
  });

  if (versionsCount > 0) {
    return error(
      "Cannot delete a language that has versions. Delete its versions first.",
      "HAS_DEPENDENCIES",
      409
    );
  }

  await prisma.language.delete({ where: { id: parseInt(id) } });
  return success({ deleted: true });
}
