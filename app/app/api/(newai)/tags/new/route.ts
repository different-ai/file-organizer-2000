import { generateNewTags } from "../../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const generateTagsData = await generateNewTags(content, fileName, model);
    const generatedTags = generateTagsData.object.tags ?? [];

    const tokens = generateTagsData.usage.totalTokens;
    console.log("incrementing token usage new tags", userId, tokens);
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