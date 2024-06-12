import { openai } from "@ai-sdk/openai";
import { generateAliasVariations } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { handleAuthorization } from "@/middleware";
import { incrementTokenUsage } from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { fileName, content } = await request.json();
  const model = openai("gpt-4o");
  const generateAliasData = await generateAliasVariations(
    fileName,
    content,
    model
  );
  const tokens = generateAliasData.usage.totalTokens;
  console.log("incrementing token usage aliases", userId, tokens);
  const aliases = generateAliasData.object.aliases;
  await incrementTokenUsage(userId, tokens);
  const response = NextResponse.json({ aliases });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
