import { formatDocumentContent } from "../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, formattingInstruction, model: requestModel } = await request.json();
    const model = requestModel === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(requestModel || process.env.MODEL_NAME);
    const response = await formatDocumentContent(
      content,
      formattingInstruction,
      model
    );
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage format", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ content: response.object.formattedContent });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
