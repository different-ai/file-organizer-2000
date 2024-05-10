import { generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";

export async function POST(request: Request) {
  const { content, fileName, templateNames } = await request.json();
  const modelName = process.env.MODEL_CLASSIFY || "gpt-4-turbo";
  const model = models[modelName];
  const prompt = generatePrompt(modelName, content, fileName, templateNames);

  const { text: documentType } = await generateText({
    model,
    prompt: prompt,
  });

  return NextResponse.json({ documentType: documentType.trim() });
}
