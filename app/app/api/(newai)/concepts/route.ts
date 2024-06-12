import { identifyConcepts } from "../../../../aiService";
import { openai } from "@ai-sdk/openai";
import { NextResponse, NextRequest } from "next/server";
import { incrementTokenUsage } from "@/drizzle/schema";
import { handleAuthorization } from "@/middleware";

export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content } = await request.json();
  const model = openai("gpt-4o");
  const response = await identifyConcepts(content, model);
  const tokens = response.usage.totalTokens;
  console.log("incrementing token usage concepts", userId, tokens);
  await incrementTokenUsage(userId, tokens);

  return NextResponse.json({ concepts: response.object.concepts });
}
