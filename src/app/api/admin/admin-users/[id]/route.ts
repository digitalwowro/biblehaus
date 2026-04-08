import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, email, password } = body;

  if (!email) {
    return error("Email is required", "VALIDATION_ERROR", 400);
  }

  const adminUser = await prisma.adminUser.update({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    data: {
      email,
      name: name || null,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  return success(adminUser);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const adminId = parseInt(id);

  if (parseInt(session.sub) === adminId) {
    return error(
      "You cannot delete the admin account you are currently using.",
      "FORBIDDEN",
      403
    );
  }

  await prisma.adminUser.delete({ where: { id: adminId } });
  return success({ deleted: true });
}
