import { openai } from "@ai-sdk/openai";
import { generateAliasVariations } from "../../../../../src/aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { fileName, content } = await request.json();
  const model = openai("gpt-4o");
  const aliases = await generateAliasVariations(fileName, content, model);

  const response = NextResponse.json({ aliases });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}

