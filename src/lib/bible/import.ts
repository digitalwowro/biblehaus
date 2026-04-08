import Papa from "papaparse";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Expected CSV format:
 * book_number, book_name, book_abbreviation, testament, chapter, verse, text
 *
 * Example:
 * 1,Genesis,Gen,OT,1,1,"In the beginning God created the heaven and the earth."
 *
 * Expected JSON format:
 * [{ book_number, book_name, book_abbreviation, testament, chapter, verse, text }]
 */

export interface BibleRow {
  book_number: number;
  book_name: string;
  book_abbreviation?: string;
  testament: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ImportResult {
  books: number;
  chapters: number;
  verses: number;
  errors: string[];
}

export function parseCSV(content: string): BibleRow[] {
  const result = Papa.parse<BibleRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const errorMsgs = result.errors
      .slice(0, 5)
      .map((e) => `Row ${e.row}: ${e.message}`);
    throw new Error(`CSV parse errors: ${errorMsgs.join("; ")}`);
  }

  return result.data.map((row) => ({
    ...row,
    book_number: Number(row.book_number),
    chapter: Number(row.chapter),
    verse: Number(row.verse),
  }));
}

export function parseJSON(content: string): BibleRow[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error("JSON must be an array of verse objects");
  }
  return data.map((row: BibleRow) => ({
    ...row,
    book_number: Number(row.book_number),
    chapter: Number(row.chapter),
    verse: Number(row.verse),
  }));
}

export function validateRows(rows: BibleRow[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.book_number || isNaN(row.book_number)) {
      errors.push(`Row ${i + 1}: missing or invalid book_number`);
    }
    if (!row.book_name) {
      errors.push(`Row ${i + 1}: missing book_name`);
    }
    if (!row.testament || !["OT", "NT"].includes(row.testament.toUpperCase())) {
      errors.push(`Row ${i + 1}: testament must be "OT" or "NT"`);
    }
    if (!row.chapter || isNaN(row.chapter)) {
      errors.push(`Row ${i + 1}: missing or invalid chapter`);
    }
    if (!row.verse || isNaN(row.verse)) {
      errors.push(`Row ${i + 1}: missing or invalid verse`);
    }
    if (!row.text) {
      errors.push(`Row ${i + 1}: missing text`);
    }
    if (errors.length >= 10) break;
  }
  return errors;
}

export async function importBibleData(
  prisma: PrismaClient,
  versionId: number,
  rows: BibleRow[]
): Promise<ImportResult> {
  const errors = validateRows(rows);
  if (errors.length > 0) {
    return { books: 0, chapters: 0, verses: 0, errors };
  }

  // Group by book
  const bookMap = new Map<
    number,
    { name: string; abbreviation: string; testament: string; chapters: Map<number, BibleRow[]> }
  >();

  for (const row of rows) {
    if (!bookMap.has(row.book_number)) {
      bookMap.set(row.book_number, {
        name: row.book_name,
        abbreviation: row.book_abbreviation || "",
        testament: row.testament.toUpperCase(),
        chapters: new Map(),
      });
    }
    const book = bookMap.get(row.book_number)!;
    if (!book.chapters.has(row.chapter)) {
      book.chapters.set(row.chapter, []);
    }
    book.chapters.get(row.chapter)!.push(row);
  }

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;

  // Import in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing data for this version
    await tx.book.deleteMany({ where: { versionId } });

    for (const [bookNumber, bookData] of bookMap) {
      const book = await tx.book.create({
        data: {
          versionId,
          bookNumber,
          name: bookData.name,
          abbreviation: bookData.abbreviation || null,
          testament: bookData.testament,
          totalChapters: bookData.chapters.size,
        },
      });
      totalBooks++;

      for (const [chapterNumber, verses] of bookData.chapters) {
        const chapter = await tx.chapter.create({
          data: {
            bookId: book.id,
            chapterNumber,
            totalVerses: verses.length,
          },
        });
        totalChapters++;

        await tx.verse.createMany({
          data: verses.map((v) => ({
            chapterId: chapter.id,
            verseNumber: v.verse,
            text: v.text,
          })),
        });
        totalVerses += verses.length;
      }
    }
  });

  return { books: totalBooks, chapters: totalChapters, verses: totalVerses, errors: [] };
}
