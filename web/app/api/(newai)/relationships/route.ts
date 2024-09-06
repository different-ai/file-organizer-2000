import { generateRelationships } from "../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { activeFileContent, files } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const { userId } = await handleAuthorization(request);

    const relationshipsData = await generateRelationships(
      activeFileContent,
      files,
      model
    );
    const similarFiles = relationshipsData.object.similarFiles;
    const tokens = relationshipsData.usage.totalTokens;
    console.log("incrementing token usage relationships", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);
    const response = NextResponse.json({ similarFiles });
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
