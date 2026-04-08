import OpenAI from "openai";

let client: OpenAI | null = null;
const DEFAULT_MODEL = "tts-1";
const DEFAULT_VOICE = "nova";
const DEFAULT_SPEED = 0.9;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function isConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function getModel(): "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts" {
  const model = process.env.TTS_MODEL?.trim();
  if (
    model === "tts-1" ||
    model === "tts-1-hd" ||
    model === "gpt-4o-mini-tts"
  ) {
    return model;
  }
  return DEFAULT_MODEL;
}

function getVoice():
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "sage"
  | "shimmer"
  | "verse" {
  return (process.env.TTS_VOICE || DEFAULT_VOICE) as
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo"
    | "fable"
    | "onyx"
    | "nova"
    | "sage"
    | "shimmer"
    | "verse";
}

function getSpeed(): number {
  const raw = Number(process.env.TTS_SPEED ?? DEFAULT_SPEED);
  if (Number.isNaN(raw)) return DEFAULT_SPEED;
  return Math.max(0.25, Math.min(4, raw));
}

function getInstructions(model: string): string | undefined {
  const instructions = process.env.TTS_INSTRUCTIONS?.trim();
  if (!instructions) return undefined;
  return model === "gpt-4o-mini-tts" ? instructions : undefined;
}

export function getSpeechCacheVariant(): string {
  const model = getModel();
  const voice = getVoice();
  const speed = getSpeed().toFixed(2);
  const instructions = getInstructions(model);
  return instructions
    ? `${model}-${voice}-${speed}-${instructions}`
    : `${model}-${voice}-${speed}`;
}

export async function generateSpeech(text: string): Promise<Buffer> {
  const model = getModel();
  const voice = getVoice();
  const speed = getSpeed();
  const instructions = getInstructions(model);
  const response = await getClient().audio.speech.create({
    model,
    voice,
    input: text,
    response_format: "mp3",
    speed,
    ...(instructions ? { instructions } : {}),
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
