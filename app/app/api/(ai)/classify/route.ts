import { generateModelCall } from "./prompt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, templateNames } = await request.json();

  const call = generateModelCall(content, fileName, templateNames);
  const response = await call();

  return NextResponse.json({ documentType: response.documentType });
}