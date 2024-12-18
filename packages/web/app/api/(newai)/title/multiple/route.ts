import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { document, renameInstructions, currentName, vaultTitles } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const prompt = `As an AI specializing in document analysis, your task is to generate highly specific and unique titles for the given document. Analyze the content thoroughly to identify key elements such as:

    - Main topics or themes
    - Specific projects, products, or initiatives
    - Key stakeholders or entities involved
    - Crucial actions, decisions, or outcomes

    Create 3 distinct titles that capture the essence of the document. Each title should:
    - Be highly specific and unique to the document's content
    - Contain no more than 50 characters
    - Avoid using special characters
    - Be easily searchable and relevant
    - Not follow any predefined patterns or formats

    Additional context:
    Time: ${new Date().toISOString()}
    Current Name: ${currentName}
    Document Content: ${document}

    ${vaultTitles && vaultTitles.length > 0 ? `
      Strongly inspire the structure and tone of the title from this titles list:
    ${vaultTitles.join('\n')}
` : ''}

    ${renameInstructions}

    Remember, the goal is to create titles that are instantly informative and distinguishable from other documents.`;
    const system = `Only answer with human readable titles`;

    const generateTitlesData = await generateObject({
      model,
      schema: z.object({
        names: z.array(z.string().max(60)).length(3),
      }),
      system,
      prompt,
    });
    const titles = generateTitlesData.object.names;
    const tokens = generateTitlesData.usage.totalTokens;
    await incrementAndLogTokenUsage(userId, tokens);

    const response = NextResponse.json({ titles });
    response.headers.set("Access-Control-Allow-Origin", "*");

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}