import { openai } from "@ai-sdk/openai";
import { guessRelevantFolder } from "../../../../aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, folders } = await request.json();
  const model = openai("gpt-4o");
  const response = await guessRelevantFolder(content, fileName, folders, model);

  return NextResponse.json({
    folder: response.object.suggestedFolder,
  });
}
