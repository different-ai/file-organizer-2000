import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, existingTags, customInstructions } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await generateObject({
      model,
      schema: z.object({
        suggestedTags: z
          .array(
            z.object({
              score: z.number().min(0).max(100),
              isNew: z.boolean(),
              tag: z.string(),
              reason: z.string(),
            })
          )
      }),
      system: `Given the content and (if useful) the file name: "${fileName}", suggest at least 3 tags. You can use the following list: ${existingTags?.join(
        ", if none of the tags are relevant, suggest new tags"
      )}, ${
        customInstructions
          ? `with the following custom instructions: "${customInstructions}"`
          : ""
      }`,
      prompt: `Given the content: "${content}"`,
    });

    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage tags", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({
      tags: response.object.suggestedTags.sort((a, b) => b.score - a.score),
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