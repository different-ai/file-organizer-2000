import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, existingTags } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const isUntitled = fileName.toLowerCase().includes('untitled');
    const prompt = `Generate multiple tags for the ${isUntitled ? 'content' : 'file "' + fileName + '" and content'} :
    
    1. One tag reflecting the topic or platform
    2. One tag indicating the document type (e.g., meeting_notes, research, brainstorm, draft).
    3. One more specific tag inspired by the file name 
    4. Use hyphens for multi-word tags.
    5. Ensure tags are concise and reusable across notes.
    6. Return null if no tags can be generated.
    7. Do not suggest tags that are already present in the content
    8. Use a mix of existing tags: ${existingTags.join(', ')} and novel ones.
    
    Examples:
    - Use moderately broad tags like fitness_plan, not overly specific like monday_dumbells_20kg.
    - For "humility and leadership", use humility.`

    const response = await generateObject({
      model,
      temperature: 0.5,
      schema: z.object({
        suggestedTags: z.array(z.object({
          isNew: z.boolean(),
          score: z.number().min(0).max(100),
          tag: z.string(),
          reason: z.string(),
        })).min(3)
      }),
      system: prompt,
      prompt: "Content is: " + content,
    });

    // increment tokenUsage
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage new tags", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    // Filter out tags that are already in existingTags
    const filteredTags = response.object.suggestedTags.filter(tag => !existingTags.includes(tag.tag));

    return NextResponse.json({
      tags: filteredTags.sort((a, b) => b.score - a.score),
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