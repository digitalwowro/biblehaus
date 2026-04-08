import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function isConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateSpeech(text: string): Promise<Buffer> {
  const voice = (process.env.TTS_VOICE || "nova") as "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer";
  const response = await getClient().audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3",
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
