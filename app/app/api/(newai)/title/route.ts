import { NextResponse, NextRequest } from "next/server";
import { generateDocumentTitle } from "../../../../aiService";
import { openai } from "@ai-sdk/openai";
import { incrementTokenUsage } from "@/drizzle/schema";
import { handleAuthorization } from "@/middleware";

export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);

  const { document } = await request.json();
  const model = openai("gpt-4o");
  const generateTitleData = await generateDocumentTitle(document, model);
  const title = generateTitleData.object.name;
  // Increment token usage
  const tokens = generateTitleData.usage.totalTokens;
  console.log("incrementing token usage title", userId, tokens);
  await incrementTokenUsage(userId, tokens);

  const response = NextResponse.json({ title });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
