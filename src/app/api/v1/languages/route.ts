import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { success } from "@/lib/api/response";
import { validateApiKey, logRequest } from "@/lib/api/validate-key";

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nativeName: true,
      direction: true,
      _count: { select: { versions: true } },
    },
  });

  const data = languages.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    nativeName: l.nativeName,
    direction: l.direction,
    versionCount: l._count.versions,
  }));

  const res = success(data, { total: data.length });

  logRequest(auth.apiKeyId!, "GET", "/api/v1/languages", 200, request.headers.get("x-forwarded-for"));

  return res;
}
