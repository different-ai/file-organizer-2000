import { NextResponse, NextRequest } from "next/server";
import { generateDocumentTitle } from "../../../../aiService";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const authResult = await handleAuthorization(request);

  if (authResult.response && authResult.response.status === 429) {
    return NextResponse.json(
      { error: "User Reached Monthly Token Limit" },
      { status: 429 }
    );
  }
  const { userId } = authResult;

  const { document } = await request.json();
  const model = getModel(process.env.MODEL_NAME);
  const generateTitleData = await generateDocumentTitle(document, model);
  const title = generateTitleData.object.name;
  // Increment token usage
  const tokens = generateTitleData.usage.totalTokens;
  console.log("incrementing token usage title", userId, tokens);
  await incrementAndLogTokenUsage(userId, tokens);

  const response = NextResponse.json({ title });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
