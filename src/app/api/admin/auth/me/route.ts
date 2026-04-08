import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { success, error } from "@/lib/api/response";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return error("Not authenticated", "UNAUTHORIZED", 401);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: parseInt(session.sub) },
    select: { id: true, email: true, name: true },
  });

  if (!admin) {
    return error("Admin user not found", "NOT_FOUND", 404);
  }

  return success(admin);
}
