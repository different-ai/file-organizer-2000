import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promises as fsPromises } from "node:fs";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { audio, extension } = await request.json();
    if (!audio || !extension) {
      return NextResponse.json({ error: "Missing audio or extension" }, { status: 400 });
    }

    console.log({ audio, extension });
    const base64Data = audio.split(";base64,").pop();
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid base64 data" }, { status: 400 });
    }

    const tempFilePath = join(tmpdir(), `upload_${Date.now()}.${extension}`);
    await fsPromises.writeFile(tempFilePath, base64Data, { encoding: "base64" });

    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
    });
    console.log({ transcription });

    await fsPromises.unlink(tempFilePath);
    return NextResponse.json({ text: transcription.text });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}