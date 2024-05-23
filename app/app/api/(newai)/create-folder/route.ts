import { createNewFolder } from "../../../../aiService";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { content, fileName, existingFolders } = await request.json();
  const model = openai("gpt-4o");
  const newFolderName = await createNewFolder(
    content,
    fileName,
    existingFolders,
    model
  );

  const response = NextResponse.json({ folderName: newFolderName });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}