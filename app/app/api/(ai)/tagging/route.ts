import { generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";

// ... (keep the generatePrompt function unchanged)

export async function POST(request: Request) {
  const { content, fileName, tags } = await request.json();
  const modelName = process.env.MODEL_TAGGING || "gpt-4-turbo";

  const model = models[modelName];
  const prompt = generatePrompt(modelName, content, fileName, tags);

  const object = generateText({
    model,
    prompt,
    system:
      "you always answer a list of tags that exist separate them with commas. only answer tags nothing else",
  });

  const normalizedTags = (await object).text
    .split(",")
    .map((tag: string) => tag.replace("#", "").trim())
    .filter((tag: string) => !content.includes(tag));

  return NextResponse.json({ tags: normalizedTags });
}
