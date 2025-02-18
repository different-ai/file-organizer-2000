import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, customInstructions, count = 3, useDeepseek = false, useOllama = false } =
      await request.json();
    
    // Log request parameters
    console.log("Folder suggestion request:", { fileName, useDeepseek, useOllama });
    
    // Only use Deepseek if both Ollama and Deepseek are enabled
    const useDeepseekModel = useDeepseek && useOllama;
    const model = useDeepseekModel ? "deepseek-r1:1.5b" : getModel(process.env.MODEL_NAME);
    
    console.log("Selected model for folder suggestions:", model);
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

    try {
      // Attempt to parse and validate response
      const suggestedFolders = response.object.suggestedFolders;
      console.log("Raw folder suggestions:", suggestedFolders);
      
      if (!Array.isArray(suggestedFolders)) {
        throw new Error("Invalid response format: suggestedFolders is not an array");
      }

      return NextResponse.json({
        folders: suggestedFolders.sort((a, b) => b.score - a.score),
      });
    } catch (parseError) {
      console.error("Error parsing folder suggestions:", parseError);
      return NextResponse.json(
        { error: "Failed to parse folder suggestions" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
