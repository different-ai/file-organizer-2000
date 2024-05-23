import { generateTags } from "../../../../../src/aiService";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { content, fileName, tags } = await request.json();
  const model = openai("gpt-4o");
  const generatedTags = await generateTags(content, fileName, tags, model);

  const response = NextResponse.json({ tags: generatedTags });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "app://obsidian.md");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
