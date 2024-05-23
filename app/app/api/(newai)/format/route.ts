import { formatDocumentContent } from "../../../../../src/aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, formattingInstruction } = await request.json();
  const formattedContent = await formatDocumentContent(content, formattingInstruction);

  const response = NextResponse.json({ content: formattedContent });
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}
