import { createNewFolder } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { incrementTokenUsage } from "@/drizzle/schema";
import { handleAuthorization } from "@/middleware";
export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { content, fileName, existingFolders } = await request.json();
  const model = openai("gpt-4o");

  const newFolderData = await createNewFolder(
    content,
    fileName,
    existingFolders,
    model
  );
  // increment tokenUsage
  const tokens = newFolderData.usage.totalTokens;
  console.log("incrementing token usage create folders", userId, tokens);
  await incrementTokenUsage(userId, tokens);
  const newFolderName = newFolderData.object.newFolderName;
  const response = NextResponse.json({ folderName: newFolderName });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
