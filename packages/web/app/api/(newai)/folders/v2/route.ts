import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";
import { ollama } from "ollama-ai-provider";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, customInstructions, count = 3, useLocalLLMForFolderGuess = false } =
      await request.json();
    
    const schema = z.object({
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
    });

    let response;
    if (useLocalLLMForFolderGuess) {
      response = await generateObject({
        model: ollama("deepseek-r1:1.5b"),
        schema,
        system: `You are a helpful AI that suggests the best folder for the provided note.
You must respond ONLY with a JSON object that includes an array of suggested folders.
Each folder suggestion must include a score (0-100), whether it's a new folder (boolean),
the folder name (string), and a reason for the suggestion (string).`,
        prompt: `Note content: ${content}
File name: ${fileName}
Possible folders: ${folders.join(", ")}
${customInstructions ? `Instructions: "${customInstructions}"` : ""}
Suggest exactly ${count} folders. If none of the existing folders are suitable, suggest new ones.`,
      });
    } else {
      const model = getModel(process.env.MODEL_NAME);
      response = await generateObject({
        model,
        schema,
        system: `Given the content and file name: "${fileName}", suggest exactly ${count} folders. You can use: ${folders.join(
          ", "
        )}. If none are relevant, suggest new folders. ${
          customInstructions ? `Instructions: "${customInstructions}"` : ""
        }`,
        prompt: `Content: "${content}"`
      });
    }
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
