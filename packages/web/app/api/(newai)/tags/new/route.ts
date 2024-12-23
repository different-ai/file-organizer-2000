import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const isUntitled = fileName.toLowerCase().includes('untitled');
    const prompt = `Generate 3 tags for the ${isUntitled ? 'content' : 'file "' + fileName + '" and content'} "${content}":
    
    1. One tag reflecting the topic or platform
    2. One tag indicating the document type (e.g., meeting_notes, research, brainstorm, draft).
    3. One more specific tag inspired by the file name 
    4. Use hyphens for multi-word tags.
    5. Ensure tags are concise and reusable across notes.
    6. Return null if no tags can be generated.
    7. Do not suggest tags that are already present in the content.
    
    Examples:
    - Use moderately broad tags like fitness_plan, not overly specific like monday_dumbells_20kg.
    - For "humility and leadership", use humility.`

    const response = await generateObject({
      model,
      temperature: 0.5,
      schema: z.object({
        tags: z.array(z.string()).max(3),
      }),
      prompt: prompt,
    });

    // Filter tags based on relevance, format them, and exclude existing tags
    const generatedTags = response.object.tags
      .filter((tag) => {
        const cleanedTag = tag.toLowerCase().replace(/\s+/g, '');
        return cleanedTag !== 'none' && cleanedTag !== '' && !content.toLowerCase().includes(`#${cleanedTag}`);
      })
      .map(tag => tag.replace(/\s+/g, '').toLowerCase());

    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage new tags", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ generatedTags });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}