import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";
import { z } from "zod";
import { generateObject } from "ai";
import { diffLines } from "diff";

const modifySchema = z.object({
  content: z.string().describe("The modified content"),
  diff: z.array(z.object({
    value: z.string(),
    added: z.boolean().optional(),
    removed: z.boolean().optional()
  })).describe("The diff between original and modified content"),
  explanation: z.string().describe("Explanation of changes made")
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, originalContent, instructions, model = process.env.MODEL_NAME } = await request.json();
    const modelProvider = model === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(model);

    const response = await generateObject({
      model: modelProvider,
      schema: modifySchema,
      system: `You are a precise code and text modification assistant. Your task is to modify the given content according to the user's instructions.
              Follow these guidelines:
              - Make minimal necessary changes to achieve the goal
              - Preserve important formatting and structure
              - Generate clear diffs to show changes
              - Provide clear explanations for changes
              ${instructions ? `Additional instructions: ${instructions}` : ''}`,
      prompt: `Original content: """
              ${originalContent}
              """`,
    });

    // Generate diff
    const diff = diffLines(originalContent, response.object.content);

    // Log token usage
    await incrementAndLogTokenUsage(userId, response.usage.totalTokens);

    return NextResponse.json({
      content: response.object.content,
      diff,
      explanation: response.object.explanation
    });
  } catch (error) {
    console.error("Error in modify route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to modify content" },
      { status: error.status || 500 }
    );
  }
}  