import { generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";

export async function POST(request: Request) {
  const { content, fileName, folders } = await request.json();
  const modelName = process.env.MODEL_FOLDERS || "gpt-4-turbo";
  const model = models[process.env.MODEL_FOLDERS || "gpt-4-turbo"];

  const prompt = generatePrompt(modelName, content, fileName, folders);

  const { text } = await generateText({
    model,
    prompt: prompt,
    system:
      "you always answer a folder that exists in the list of folders.just the folder path. if none are appropriate respond with None only answer the folder path nothing else. e.g. /Private or /Blog/Ideas",
  });

  const sanitizedFolderName = text.replace(/[\\:*?"<>|]/g, "");

  return NextResponse.json({ folder: sanitizedFolderName });
}
