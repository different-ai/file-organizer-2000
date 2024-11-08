import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

function sanitizeFileName(fileName: string) {
  // Allow alphanumeric characters and spaces
  // Replace all other characters with underscores
  return fileName.replace(/[^a-zA-Z0-9\s]/g, "_");
}



export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, customInstructions } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const response = await generateObject({
      model,
      schema: z.object({
        suggestedTitles: z.array(
          z.object({
            score: z.number().min(0).max(100),
            title: z.string(),
            reason: z.string(),
          })
        ),
      }),
      system: `Given the content and (if useful) the current file name: "${fileName}", suggest at least 3 clear and concise titles for this content.  avoid using special characters${
        customInstructions
          ? `Follow these custom instructions: "${customInstructions}"`
          : ""
      }`,
      prompt: `Given the content: "${content}"`,
    });

    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage titles", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);
    // make sure all titles are file system safe
    console.log("sanitizing titles", response.object.suggestedTitles);
    const safeTitles = response.object.suggestedTitles.map((title) => {
      return { ...title, title: sanitizeFileName(title.title) };
    });


    return NextResponse.json({
      titles: safeTitles.sort((a, b) => b.score - a.score),
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
