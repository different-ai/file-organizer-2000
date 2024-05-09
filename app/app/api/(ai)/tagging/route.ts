import { generateText } from "ai";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generateModelCall } from "./prompt";

// ... (keep the generatePrompt function unchanged)

export async function POST(request: Request) {
  const { content, fileName, tags } = await request.json();

  const call = generateModelCall(content, fileName, tags);

  const response = await call();

  // infer response by generateText
  if (response.text) {
    const normalizedTags = response.text
      .split(",")
      .map((tag: string) => tag.replace("#", "").trim())
      .filter((tag: string) => !content.includes(tag));
    return NextResponse.json({ tags: normalizedTags });
  }

  // if returned by generateObject
  const normalizedTags = response.object.tags
    .map((tag: string) => tag.replace("#", "").trim())
    .filter((tag: string) => !content.includes(tag));

  return NextResponse.json({ tags: normalizedTags });
}
