import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, customInstructions } =
      await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await generateObject({
      model,
      schema: z.object({
        suggestedFolders: z
          .array(
            z.object({
              score: z.number().min(0).max(100),
              isNewFolder: z.boolean(),
              folder: z.string(),
              reason: z.string(),
            })
          )
      }),
      system: `Given the content and (if useful) the file name: "${fileName}", suggest at least 3 folders you can use the following list: ${folders.join(
        ", if none of the folders are relevant, suggest new folders"
      )}, ${
        customInstructions
          ? `with the following custom instructions: "${customInstructions}"`
          : ""
      }`,
      prompt: `Given the content: "${content}"`,
    });
    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage folders", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({
      folders: response.object.suggestedFolders.sort(
        (a, b) => b.score - a.score
      ),
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
