import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseCSV, parseJSON, importBibleData } from "../src/lib/bible/import";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: npx tsx scripts/import-bible.ts <version-abbreviation> <file-path>");
    console.error("");
    console.error("Examples:");
    console.error("  npx tsx scripts/import-bible.ts KJV data/kjv.csv");
    console.error("  npx tsx scripts/import-bible.ts KJV data/kjv.json");
    process.exit(1);
  }

  const [abbreviation, filePath] = args;
  const fullPath = resolve(filePath);

  // Find version
  const version = await prisma.version.findFirst({
    where: { abbreviation: { equals: abbreviation, mode: "insensitive" } },
  });

  if (!version) {
    console.error(`Version "${abbreviation}" not found in the database.`);
    console.error("Create the version in the admin panel first, then run this script.");
    process.exit(1);
  }

  // Read file
  console.log(`Reading ${fullPath}...`);
  const content = readFileSync(fullPath, "utf-8");
  const lower = filePath.toLowerCase();

  let rows;
  if (lower.endsWith(".csv")) {
    rows = parseCSV(content);
  } else if (lower.endsWith(".json")) {
    rows = parseJSON(content);
  } else {
    console.error("Only .csv and .json files are supported.");
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} verse rows.`);

  if (rows.length === 0) {
    console.error("File contains no data.");
    process.exit(1);
  }

  // Import
  console.log(`Importing into version "${version.name}" (id=${version.id})...`);
  const result = await importBibleData(prisma, version.id, rows);

  if (result.errors.length > 0) {
    console.error("Validation errors:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Import complete:`);
  console.log(`  Books:    ${result.books}`);
  console.log(`  Chapters: ${result.chapters}`);
  console.log(`  Verses:   ${result.verses}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
