import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, customInstructions, count = 3, model = process.env.MODEL_NAME, ollamaEndpoint } =
      await request.json();
    const modelProvider = model === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(model);
    const response = await generateObject({
      model: modelProvider,
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
          .min(1)
          .max(count)
      }),
      system: `Given the content and file name: "${fileName}", suggest exactly ${count} folders. You can use: ${folders.join(
        ", "
      )}. If none are relevant, suggest new folders. ${
        customInstructions ? `Instructions: "${customInstructions}"` : ""
      }`,
      prompt: `Content: "${content}"`,
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
