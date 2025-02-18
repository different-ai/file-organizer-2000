import { NextResponse, NextRequest } from "next/server";
import { generateAliasVariations } from "../aiService";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { fileName, content } = await request.json();
    const { model: selectedModel = process.env.MODEL_NAME } = await request.json();
    const model = selectedModel === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(selectedModel);
    const generateAliasData = await generateAliasVariations(
      fileName,
      content,
      model
    );
    const tokens = generateAliasData.usage.totalTokens;
    console.log("incrementing token usage aliases", userId, tokens);
    const aliases = generateAliasData.object.aliases;
    await incrementAndLogTokenUsage(userId, tokens);
    const response = NextResponse.json({ aliases });
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
