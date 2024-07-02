import { NextResponse, NextRequest } from "next/server";
import { getModel } from "@/lib/models";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { identifyConceptsAndFetchChunks } from "@/aiService";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds


export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await identifyConceptsAndFetchChunks(content, model);

    // Assuming the response includes token usage information
    const tokens = response.usage?.totalTokens || 0;
    console.log(
      "incrementing token usage for concepts-and-chunks",
      userId,
      tokens
    );
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ concepts: response });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  }
}
