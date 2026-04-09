import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function escapeCsv(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const versionId = parseInt(id, 10);

  if (Number.isNaN(versionId)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_ID", message: "Invalid version id" } },
      { status: 400 }
    );
  }

  const version = await prisma.version.findUnique({
    where: { id: versionId },
    select: {
      abbreviation: true,
      books: {
        orderBy: { bookNumber: "asc" },
        select: {
          bookNumber: true,
          name: true,
          abbreviation: true,
          testament: true,
          chapters: {
            orderBy: { chapterNumber: "asc" },
            select: {
              chapterNumber: true,
              verses: {
                orderBy: { verseNumber: "asc" },
                select: {
                  verseNumber: true,
                  text: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!version) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Version not found" } },
      { status: 404 }
    );
  }

  const lines: string[] = [
    "book_number,book_name,book_abbreviation,testament,chapter,verse,text",
  ];

  for (const book of version.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        lines.push(
          [
            escapeCsv(book.bookNumber),
            escapeCsv(book.name),
            escapeCsv(book.abbreviation),
            escapeCsv(book.testament),
            escapeCsv(chapter.chapterNumber),
            escapeCsv(verse.verseNumber),
            escapeCsv(verse.text),
          ].join(",")
        );
      }
    }
  }

  const filename = `${version.abbreviation.toLowerCase()}.csv`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
