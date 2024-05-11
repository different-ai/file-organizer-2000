import { NextResponse } from "next/server";
import { generateModelCall } from "./prompt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { content, fileName, tags } = await request.json();

  const call = generateModelCall(content, fileName, tags);
  const response = await call();

  const normalizedTags = response.tags
    .map((tag) => tag.replace("#", "").trim())
    .map((tag) => `#${tag}`)
    .filter((tag) => !content.includes(tag));

  return NextResponse.json({ tags: normalizedTags });
}
