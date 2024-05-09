import fs from "fs";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export async function POST(request: Request) {
  const { file } = await request.json();
  const base64Data = file.split(";base64,").pop();
  const tempFilePath = join(tmpdir(), `upload_${Date.now()}.m4a`);
  await fsPromises.writeFile(tempFilePath, base64Data, {
    encoding: "base64",
  });

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: "whisper-1",
  });

  await fsPromises.unlink(tempFilePath);

  return NextResponse.json({ text: transcription.text });
}