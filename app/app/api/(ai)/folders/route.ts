import { generateModelCall } from "./prompt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content, fileName, folders } = await request.json();

  const call = generateModelCall(content, fileName, folders);
  const response = await call();

  const sanitizedFolderName = response.suggestedFolder.replace(/[\\:*?"<>|]/g, "");

  return NextResponse.json({ folder: sanitizedFolderName });
}