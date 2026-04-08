import { clearUserSession } from "@/lib/auth/user-session";
import { success } from "@/lib/api/response";

export async function POST() {
  await clearUserSession();
  return success({ message: "Logged out" });
}
