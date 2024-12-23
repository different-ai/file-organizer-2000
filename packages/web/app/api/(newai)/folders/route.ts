import { guessRelevantFolder } from "../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, customInstructions } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await guessRelevantFolder(
      content,
      fileName,
      folders,
      model,
      customInstructions
    );
    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage folders", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);
    return NextResponse.json({
      folder: response.object.suggestedFolder,
    });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
