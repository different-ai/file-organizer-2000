import { generateRelationships } from "../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const { activeFileContent, files } = await request.json();
  const model = getModel(process.env.MODEL_NAME);

  const authResult = await handleAuthorization(request);

  if (authResult.response && authResult.response.status === 429) {
    return NextResponse.json(
      { error: "User Reached Monthly Token Limit" },
      { status: 429 }
    );
  }
  const { userId } = authResult;

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
}
