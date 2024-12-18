import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

const formatSchema = z.object({
  markdown: z.string().min(1),
  frontmatter: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, formattingInstruction = "" } = await request.json();

    const response = await generateObject({
      model: getModel(process.env.MODEL_NAME),
      schema: formatSchema,
      system: `You are a precise document formatter. Format the given content according to the user's instructions.
              ${
                formattingInstruction
                  ? `Follow these formatting instructions: ${formattingInstruction}`
                  : "Format as clean markdown"
              }
              
              Guidelines:
              - Maintain the original meaning and key information
              - Ensure proper markdown syntax
              - Preserve code blocks and their language specifications
              - Keep formatting consistent throughout the document
              - This is for Obsidian, so use Obsidian-compatible markdown
              
              `,
      prompt: `Content to format: """
              ${content}
              """`,
    });

    await incrementAndLogTokenUsage(userId, response.usage.totalTokens);

    return NextResponse.json({ content: response.object.markdown });
  } catch (error) {
    console.error("Format generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to format content" },
      { status: error.status || 500 }
    );
  }
}
