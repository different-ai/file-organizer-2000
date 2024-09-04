import { generateExistingTags } from "../../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, vaultTags } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const generateTagsData = await generateExistingTags(content, fileName, vaultTags, model);
    
    // Strict filtering of generated tags
    const generatedTags = generateTagsData.object.tags?.filter(tag => {
      const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;
      return vaultTags.some(vaultTag => {
        const normalizedVaultTag = vaultTag.startsWith('#') ? vaultTag.slice(1) : vaultTag;
        return normalizedVaultTag.toLowerCase() === normalizedTag.toLowerCase();
      });
    }) ?? [];

    const tokens = generateTagsData.usage.totalTokens;
    console.log("incrementing token usage existing tags", userId, tokens);
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