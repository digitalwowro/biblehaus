import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isConfigured, generateSpeech } from "@/lib/tts/openai";
import { getCachePath, exists, readCached, writeCached } from "@/lib/tts/cache";

// In-memory dedup: prevents duplicate OpenAI calls for the same verse
const inFlight = new Map<string, Promise<Buffer>>();

export async function GET(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "TTS not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const version = searchParams.get("version");
  const bookStr = searchParams.get("book");
  const chapterStr = searchParams.get("chapter");
  const verseStr = searchParams.get("verse");

  if (!version || !bookStr || !chapterStr || !verseStr) {
    return NextResponse.json(
      { error: "Missing required params: version, book, chapter, verse" },
      { status: 400 },
    );
  }

  const bookNumber = parseInt(bookStr);
  const chapter = parseInt(chapterStr);
  const verse = parseInt(verseStr);

  if (isNaN(bookNumber) || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json(
      { error: "book, chapter, and verse must be numbers" },
      { status: 400 },
    );
  }

  const cachePath = getCachePath(version, bookNumber, chapter, verse);

  // Serve from cache if available
  if (await exists(cachePath)) {
    const buffer = await readCached(cachePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Check for in-flight request for same verse
  if (inFlight.has(cachePath)) {
    const buffer = await inFlight.get(cachePath)!;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Look up the verse text from the database
  const verseRecord = await prisma.verse.findFirst({
    where: {
      verseNumber: verse,
      chapter: {
        chapterNumber: chapter,
        book: {
          bookNumber,
          version: {
            abbreviation: { equals: version, mode: "insensitive" },
          },
        },
      },
    },
  });

  if (!verseRecord) {
    return NextResponse.json({ error: "Verse not found" }, { status: 404 });
  }

  // Generate speech with dedup
  const generateAndCache = async (): Promise<Buffer> => {
    const buffer = await generateSpeech(verseRecord.text);
    await writeCached(cachePath, buffer);
    return buffer;
  };

  const promise = generateAndCache();
  inFlight.set(cachePath, promise);

  try {
    const buffer = await promise;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("TTS generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 502 },
    );
  } finally {
    inFlight.delete(cachePath);
  }
}
