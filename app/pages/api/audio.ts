// pages/api/audio.ts
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { verifyKey } from "@unkey/api";
import PosthogClient from "../../lib/posthog";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // if ENABLE_USER_MANAGEMENT=true in .env file, then we need to check for the Authorization header
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: "No Authorization header" });
    }
    const token = header.replace("Bearer ", "");
    const { result, error } = await verifyKey(token);


    const client = PosthogClient();

    if (client && result?.ownerId) {
      client.capture({
        distinctId: result?.ownerId,
        event: "audio-api",
        properties: { endpoint: "audio" },
      });
    }
    if (error) {
      console.error(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!result.valid) {
      // do not grant access
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  if (req.method === "POST") {
    const { file } = req.body;
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

    // Clean up the temporary file
    await fsPromises.unlink(tempFilePath);

    res.status(200).json({ text: transcription.text });
  } else {
    // Handle any non-POST requests
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
