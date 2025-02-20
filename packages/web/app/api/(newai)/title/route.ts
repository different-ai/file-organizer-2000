import { NextResponse, NextRequest } from "next/server";
import { generateDocumentTitle } from "../aiService";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);

    const { document, instructions, currentName, model: requestModel } = await request.json();
    const model = requestModel === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(requestModel || process.env.MODEL_NAME);
    const generateTitleData = await generateDocumentTitle(
      document,
      currentName,
      model,
      instructions
    );
    const title = generateTitleData.object.name;
    // Increment token usage
    const tokens = generateTitleData.usage.totalTokens;
    console.log("incrementing token usage title", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    const response = NextResponse.json({ title });
    response.headers.set("Access-Control-Allow-Origin", "*");

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
