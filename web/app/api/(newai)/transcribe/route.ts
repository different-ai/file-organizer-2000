import fs from "fs";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { NextResponse } from "next/server";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: Request) {
  console.log("transcribe");
  const { audio, extension } = await request.json();
  console.log({ audio, extension });
  const base64Data = audio.split(";base64,").pop();
  console.log({ extension });
  const tempFilePath = join(tmpdir(), `upload_${Date.now()}.${extension}`);
  await fsPromises.writeFile(tempFilePath, base64Data, {
    encoding: "base64",
  });

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: "whisper-1",
  });

  await fsPromises.unlink(tempFilePath);

  return NextResponse.json({ text: transcription.text });
}