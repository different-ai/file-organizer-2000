import fs from "fs";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { file, extension } = await request.json();
  const base64Data = file.split(";base64,").pop();
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

  return NextResponse.json({ transcription: transcription.text });
}
