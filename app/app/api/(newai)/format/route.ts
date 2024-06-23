import { formatDocumentContent } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
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

  const { content, formattingInstruction } = await request.json();
  const model = getModel(process.env.MODEL_NAME);
  const response = await formatDocumentContent(
    content,
    formattingInstruction,
    model
  );
  const tokens = response.usage.totalTokens;
  console.log("incrementing token usage format", userId, tokens);
  await incrementAndLogTokenUsage(userId, tokens);

  return NextResponse.json({ content: response.object.formattedContent });
}
