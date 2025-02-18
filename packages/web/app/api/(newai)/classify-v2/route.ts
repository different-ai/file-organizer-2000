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
    const { content, fileName, templateNames, model = process.env.MODEL_NAME } = await request.json();
    const modelProvider = model === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(model);

    const response = await generateObject({
      model: modelProvider,
      schema: z.object({
        documentTypes: z.array(
          z.object({
            documentType: z.string(),
            confidence: z.number().min(0).max(100),
            reasoning: z.string(),
          })
        )
      }),
      system: `Given the content and file name: "${fileName}", classify the document type. Available templates: ${templateNames.join(
        ", "
      )}. Return up to 3 possible classifications with confidence scores and reasoning.`,
      prompt: `Content: "${content}"`,
    });

    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage classify", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    // Sort by confidence and return
    return NextResponse.json({
      classification: response.object.documentTypes.sort(
        (a, b) => b.confidence - a.confidence
      )[0],
      alternatives: response.object.documentTypes.slice(1),
    });
  } catch (error) {
    console.error("Error in classify-v2", error);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  }
}  