import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { document, renameInstructions, currentName } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const prompt = `You are an AI specialized in generating concise and relevant document titles. Ensure each title is under 50 characters, contains no special characters, and is highly specific to the document's content.
    Additional context:
    Time: ${new Date().toISOString()}
    Current Name: ${currentName}
    Document Content: ${document}
    Provide 3 suitable but varied titles
    ${renameInstructions}
    `;
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
    console.log("generateTitlesData", generateTitlesData);
    console.log("titles", titles);
    console.log("incrementing token usage titles", userId, tokens);
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