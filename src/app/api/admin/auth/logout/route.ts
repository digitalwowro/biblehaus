import { clearSession } from "@/lib/auth/session";
import { success } from "@/lib/api/response";

export async function POST() {
  await clearSession();
  return success({ message: "Logged out" });
}
