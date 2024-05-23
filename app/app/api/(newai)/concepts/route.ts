import { identifyConcepts } from "../../../../aiService";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content } = await request.json();
  const model = openai("gpt-4o");
  const concepts = await identifyConcepts(content, model);

  const response = NextResponse.json({ concepts });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
