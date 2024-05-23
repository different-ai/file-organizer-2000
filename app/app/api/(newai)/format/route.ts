import { formatDocumentContent } from "../../../../aiService";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, formattingInstruction } = await request.json();
  const model = openai("gpt-4o");
  const formattedContent = await formatDocumentContent(
    content,
    formattingInstruction,
    model
  );

  const response = NextResponse.json({ content: formattedContent });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
