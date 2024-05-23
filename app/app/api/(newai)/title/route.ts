import { openai } from "@ai-sdk/openai";
import { generateDocumentTitle } from "../../../../aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { document } = await request.json();
  const model = openai("gpt-4o");

  const title = await generateDocumentTitle(document, model);

  const response = NextResponse.json({ title });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
