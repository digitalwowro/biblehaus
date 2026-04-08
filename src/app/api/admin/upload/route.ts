import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parseCSV, parseJSON, importBibleData } from "@/lib/bible/import";
import { success, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const versionId = formData.get("versionId") as string | null;

  if (!file || !versionId) {
    return error("File and version are required", "VALIDATION_ERROR", 400);
  }

  const version = await prisma.version.findUnique({
    where: { id: parseInt(versionId) },
  });

  if (!version) {
    return error("Version not found", "NOT_FOUND", 404);
  }

  const content = await file.text();
  const fileName = file.name.toLowerCase();

  let rows;
  try {
    if (fileName.endsWith(".csv")) {
      rows = parseCSV(content);
    } else if (fileName.endsWith(".json")) {
      rows = parseJSON(content);
    } else {
      return error("Only CSV and JSON files are supported", "INVALID_FORMAT", 400);
    }
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to parse file",
      "PARSE_ERROR",
      400
    );
  }

  if (rows.length === 0) {
    return error("File contains no data", "EMPTY_FILE", 400);
  }

  const result = await importBibleData(prisma, parseInt(versionId), rows);

  if (result.errors.length > 0) {
    return error(
      `Validation errors: ${result.errors.join("; ")}`,
      "VALIDATION_ERROR",
      400
    );
  }

  return success({
    message: `Imported ${result.books} books, ${result.chapters} chapters, ${result.verses} verses`,
    ...result,
  });
}
