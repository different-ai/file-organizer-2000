import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

const sanitizeFileName = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9\s]/g, "_");
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, folders, existingTags, customInstructions, classifications } = await request.json();
    const model = getModel(process.env.MODEL_NAME);

    const response = await generateObject({
      model,
      schema: z.object({
        classification: z.object({
          documentType: z.string(),
          confidence: z.number().min(0).max(100),
          reasoning: z.string(),
        }),
        folders: z.array(
          z.object({
            score: z.number().min(0).max(100),
            isNewFolder: z.boolean(),
            folder: z.string(),
            reason: z.string(),
          })
        ),
        titles: z.array(
          z.object({
            score: z.number().min(0).max(100),
            title: z.string(),
            reason: z.string(),
          }).nullable()
        ),
        tags: z.array(
          z.object({
            score: z.number().min(0).max(100),
            isNew: z.boolean(),
            tag: z.string(),
            reason: z.string(),
          })
        ),
      }),
      system: `You are an expert document organizer. Analyze the given content and:
1. Suggest relevant folders (using existing folders: ${folders.join(", ")})
2. Suggest relevant tags (existing tags: ${existingTags?.join(", ") || "none"})
3. Only generate title based on additional instructions
${classifications ? `4. Classify the document type only using these classifications: ${classifications?.join(", ") || "none"}` : ""}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Consider the relationships between all suggestions to maintain consistency.
Current filename: "${fileName}"`,
      prompt: `Content to analyze: "${content}"`,
    });

    // Sanitize titles
    const safeTitles = response.object.titles.map(title => ({
      ...title,
      title: sanitizeFileName(title.title),
    }));

    // Sort all arrays by score
    const sortByScore = <T extends { score: number }>(arr: T[]) => 
      [...arr].sort((a, b) => b.score - a.score);

    const result = {
      classification: response.object.classification,
      folders: sortByScore(response.object.folders as { score: number }[]),
      titles: sortByScore(safeTitles as { score: number }[]),
      tags: sortByScore(response.object.tags as { score: number }[]),
    };

    // Log and increment token usage
    const tokens = response.usage.totalTokens;
  console.log("incrementing token usage organize-all", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in organize-all:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error?.status || 500 }
    );
  }
} 