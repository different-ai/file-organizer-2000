import { generateObject, generateText } from "ai";
import { models } from "@/lib/models";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, formattingInstruction } = await request.json();

    const model = models[process.env.TEXT_MODEL || "gpt-4-turbo"];

    const result = await generateObject({
      model,
      schema: z.object({
        fromattedText: z.string(),
      }),
      prompt: `Format the following text according to these instructions:
      ${formattingInstruction}
      Text to format:
      ${content}
      Respond with only the formatted text.`,
    });

    return NextResponse.json({ message: result.object.fromattedText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}