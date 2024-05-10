import { NextResponse } from "next/server";
import { generateModelCall } from "./prompt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { content, fileName, tags } = await request.json();

  const call = generateModelCall(content, fileName, tags);

  const response = await call();

  // infer response by generateText
  if (response.text) {
    const normalizedTags = response.text
      .split(",")
      // sanitize remove all # and trim
      .map((tag: string) => tag.replace("#", "").trim())
      // prepend hash
      .map((tag: string) => `#${tag}`)
      .filter((tag: string) => !content.includes(tag));
    return NextResponse.json({ tags: normalizedTags });
  }

  // if returned by generateObject
  const normalizedTags = response.object.tags
    .map((tag: string) => tag.replace("#", "").trim())
    .map((tag: string) => `#${tag}`)
    .filter((tag: string) => !content.includes(tag));

  return NextResponse.json({ tags: normalizedTags });
}
