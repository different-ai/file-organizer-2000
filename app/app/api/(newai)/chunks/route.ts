import { NextResponse } from "next/server";
import { fetchChunksForConcept } from "../../../../../src/aiService";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { content, concept } = await request.json();
  const model = openai("gpt-4o");
  const chunks = await fetchChunksForConcept(content, concept, model);

  const response = NextResponse.json({ content: chunks.content });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}

