import { openai } from "@ai-sdk/openai";
import { guessRelevantFolder } from "../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content, fileName, folders } = await request.json();
  const model = openai("gpt-4o");
  const response = await guessRelevantFolder(content, fileName, folders, model);
  // increment tokenUsage
  const tokens = response.usage.totalTokens;
  console.log("incrementing token usage folders", userId, tokens);
  await incrementAndLogTokenUsage(userId, tokens);
  return NextResponse.json({
    folder: response.object.suggestedFolder,
  });
}
