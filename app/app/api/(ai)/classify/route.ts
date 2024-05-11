import { generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";

export async function POST(request: Request) {
  const { content, fileName, templateNames } = await request.json();
  const modelName = process.env.MODEL_CLASSIFY || "gpt-4-turbo";
  const model = models[modelName];
  console.log({templateNames});
  const prompt = generatePrompt(modelName, content, fileName, templateNames);
  console.log({prompt});

  const { text: documentType } = await generateText({
    model,
    prompt: prompt,
  });
  console.log({documentType});

  return NextResponse.json({ documentType: documentType.trim() });
}
