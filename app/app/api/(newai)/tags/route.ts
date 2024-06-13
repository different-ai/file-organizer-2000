import { generateTags } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { incrementTokenUsage } from "@/drizzle/schema";
import { handleAuthorization } from "@/middleware";
export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content, fileName, tags } = await request.json();
  const model = openai("gpt-4o");
  const generateTagsData = await generateTags(content, fileName, tags, model);
  const generatedTags = generateTagsData.object.tags ?? "[]";
  // Increment token usage
  const tokens = generateTagsData.usage.totalTokens;
  console.log("incrementing token usage tags", userId, tokens);
  await incrementTokenUsage(userId, tokens);

  return NextResponse.json({ generatedTags });
}
