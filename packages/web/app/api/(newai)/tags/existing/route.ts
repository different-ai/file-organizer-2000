import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";


export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, vaultTags } = await request.json();
    const model = getModel(process.env.MODEL_NAME);

    const prompt = `For "${content}" (file: "${fileName}"), select up to 3 tags from: ${vaultTags.join(", ")}. Only choose tags with an evident link to the main topics that is not too specific. If none meet this criterion, return null.`;

    const response = await generateObject({
      model,
      temperature: 0,
      schema: z.object({
        tags: z.array(z.string()).max(3).nullable(),
      }),
      prompt: prompt,
    });

    // Filter tags based on relevance, format them, and exclude existing tags
    const generatedTags = response.object.tags
      .filter((tag) => {
        const cleanedTag = tag.toLowerCase().replace(/\s+/g, '');
        return cleanedTag !== 'none' && cleanedTag !== '' && !content.toLowerCase().includes(`#${cleanedTag}`);
      })
      .map(tag => tag.replace(/\s+/g, '').toLowerCase());

    const tokens = response.usage.totalTokens;
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