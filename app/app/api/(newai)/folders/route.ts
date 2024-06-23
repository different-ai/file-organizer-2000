import { openai } from "@ai-sdk/openai";
import { guessRelevantFolder } from "../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const authResult = await handleAuthorization(request);

  if (authResult.response && authResult.response.status === 429) {
    return NextResponse.json(
      { error: "User Reached Monthly Token Limit" },
      { status: 429 }
    );
  }

  const { userId } = authResult;
  const { content, fileName, folders } = await request.json();
  const model = getModel(process.env.MODEL_NAME);
  const response = await guessRelevantFolder(content, fileName, folders, model);
  // increment tokenUsage
  const tokens = response.usage.totalTokens;
  console.log("incrementing token usage folders", userId, tokens);
  await incrementAndLogTokenUsage(userId, tokens);
  return NextResponse.json({
    folder: response.object.suggestedFolder,
  });
}
