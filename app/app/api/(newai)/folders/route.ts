import { openai } from "@ai-sdk/openai";
import { guessRelevantFolder } from "../../../../../src/aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, folders } = await request.json();
  const model = openai("gpt-4o");
  const folder = await guessRelevantFolder(content, fileName, folders, model);

  const response = NextResponse.json({ folder });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}

