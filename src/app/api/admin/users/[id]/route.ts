import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success, error } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const userId = parseInt(id);
  const { name, email, password, isSuspended, maxApiKeys } = body;

  if (isSuspended !== undefined) {
    const nextSuspendedState = Boolean(isSuspended);

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isSuspended: nextSuspendedState },
      });

      if (nextSuspendedState) {
        await tx.apiKey.updateMany({
          where: { userId, isActive: true },
          data: {
            isActive: false,
            wasActiveBeforeSuspension: true,
          },
        });

        await tx.apiKey.updateMany({
          where: {
            userId,
            isActive: false,
            wasActiveBeforeSuspension: false,
          },
          data: {
            wasActiveBeforeSuspension: false,
          },
        });
      } else {
        await tx.apiKey.updateMany({
          where: { userId, wasActiveBeforeSuspension: true },
          data: {
            isActive: true,
            wasActiveBeforeSuspension: false,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          maxApiKeys: true,
          isSuspended: true,
          createdAt: true,
        },
      });
    });

    return success(user);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      maxApiKeys: true,
      isSuspended: true,
      createdAt: true,
    },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(maxApiKeys !== undefined
        ? {
            maxApiKeys:
              maxApiKeys === null || maxApiKeys === ""
                ? null
                : Number(maxApiKeys),
          }
        : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
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
