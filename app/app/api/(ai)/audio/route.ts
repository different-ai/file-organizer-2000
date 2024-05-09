import OpenAI from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 120; // This function can run for a maximum of 5 seconds
export async function POST(request: Request) {
  const { file } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
  });

  return NextResponse.json({ text: transcription.text });
}
