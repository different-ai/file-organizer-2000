import { openai } from "@ai-sdk/openai";
import { generateRelationships } from "../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";

export async function POST(request: NextRequest) {
  const { activeFileContent, files } = await request.json();
  const model = openai("gpt-4o");
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
}
