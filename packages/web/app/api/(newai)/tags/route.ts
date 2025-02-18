import { generateTags } from "../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, tags, model: selectedModel } = await request.json();
    const model = selectedModel === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(selectedModel || process.env.MODEL_NAME);
    const generateTagsData = await generateTags(content, fileName, tags, model);
    const generatedTags = generateTagsData.object.tags ?? [];
    // Increment token usage
    const tokens = generateTagsData.usage.totalTokens;
    console.log("incrementing token usage tags", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ generatedTags });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
