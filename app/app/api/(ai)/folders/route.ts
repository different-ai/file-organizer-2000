import { generateObject, generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";
import { z } from "zod";

export async function POST(request: Request) {
  const { content, fileName, folders } = await request.json();
  const modelName = process.env.MODEL_FOLDERS || "gpt-4-turbo";
  const model = models[process.env.MODEL_FOLDERS || "gpt-4-turbo"];

  console.log("folders", folders);
  const prompt = generatePrompt(modelName, content, fileName, folders);

  const { object } = await generateObject({
    model,
    prompt: prompt,
    schema: z.object({
      suggestedFolder: z.string(),
    }),
  });

  console.log("folder", object.suggestedFolder);
  const sanitizedFolderName = object.suggestedFolder.replace(
    /[\\:*?"<>|]/g,
    ""
  );

  return NextResponse.json({ folder: sanitizedFolderName });
}
