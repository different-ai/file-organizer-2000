// app/app/api/(ai)/classify/route.ts
import { classifyDocument } from "../../../../aiService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, templateNames } = await request.json();
  const documentType = await classifyDocument(content, fileName, templateNames);
  return NextResponse.json({ documentType });
}
