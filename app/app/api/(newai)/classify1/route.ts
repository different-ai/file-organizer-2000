// app/app/api/(ai)/classify/route.ts
import { openai } from "@ai-sdk/openai";
import { classifyDocument } from "../../../../aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, templateNames } = await request.json();
  const model = openai("gpt-4o");
  const documentType = await classifyDocument(
    content,
    fileName,
    templateNames,
    model
  );
  return NextResponse.json({ documentType });
}
