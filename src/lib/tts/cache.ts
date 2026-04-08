import path from "path";
import fs from "fs/promises";

const CACHE_DIR = process.env.TTS_CACHE_DIR || ".cache/tts";

function getBasePath(): string {
  return path.isAbsolute(CACHE_DIR)
    ? CACHE_DIR
    : path.join(/* turbopackIgnore: true */ process.cwd(), ".cache", "tts");
}

export function getCachePath(
  version: string,
  bookNumber: number,
  chapter: number,
  verse: number,
): string {
  const bookPadded = String(bookNumber).padStart(2, "0");
  return path.join(
    getBasePath(),
    version.toLowerCase(),
    bookPadded,
    String(chapter),
    `${verse}.mp3`,
  );
}

export async function exists(cachePath: string): Promise<boolean> {
  try {
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
}

export async function readCached(cachePath: string): Promise<Buffer> {
  return fs.readFile(cachePath);
}

export async function writeCached(
  cachePath: string,
  data: Buffer,
): Promise<void> {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, data);
}
