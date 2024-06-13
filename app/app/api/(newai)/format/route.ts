import { formatDocumentContent } from "../../../../aiService";
import { openai } from "@ai-sdk/openai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content, formattingInstruction } = await request.json();
  const model = openai("gpt-4o");
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
