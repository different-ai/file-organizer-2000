import { openai } from "@ai-sdk/openai";
import { generateRelationships } from "../../../../aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { activeFileContent, files } = await request.json();
  const model = openai("gpt-4o");
  const similarFiles = await generateRelationships(activeFileContent, files, model);

  const response = NextResponse.json({ similarFiles });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
