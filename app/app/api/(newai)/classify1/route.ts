// app/app/api/(ai)/classify/route.ts
import { openai } from "@ai-sdk/openai";
import { classifyDocument } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementTokenUsage } from "@/drizzle/schema";
import { handleAuthorization } from "@/middleware";
export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content, fileName, templateNames } = await request.json();
  const model = openai("gpt-4o");
  const response = await classifyDocument(
    content,
    fileName,
    templateNames,
    model
  );
  // increment tokenUsage
  const tokens = response.usage.totalTokens;
  console.log("incrementing token usage classify", userId, tokens);
  await incrementTokenUsage(userId, tokens);
  const documentType = response.object.documentType;
  return NextResponse.json({ documentType });
}
