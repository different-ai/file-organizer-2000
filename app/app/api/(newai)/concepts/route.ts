import { NextResponse, NextRequest } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { identifyConcepts } from "@/aiService";

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
  const generateConceptsData = await identifyConcepts(document, model);
  const tokens = generateConceptsData.usage.totalTokens;
  console.log("incrementing token usage concepts", userId, tokens);
  const concepts = generateConceptsData.object.concepts;
  await incrementAndLogTokenUsage(userId, tokens);
  const response = NextResponse.json({ concepts });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
