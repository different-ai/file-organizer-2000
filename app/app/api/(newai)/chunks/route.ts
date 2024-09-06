import { NextResponse, NextRequest } from "next/server";
import { fetchChunksForConcept } from "../../../../aiService";
import { getModel } from "@/lib/models";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, concept } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await fetchChunksForConcept(content, concept, model);
    console.log("response", response);
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage chunks", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ content: response.object.content });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
