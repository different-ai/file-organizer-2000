import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, fileContent } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are a helpful assistant. Here's some context about the current file:
${fileContent}
Please use this context to inform your responses, but do not directly repeat this context in your answers unless specifically asked about the file content.`,
    messages: convertToCoreMessages(messages),
  });

  const response = result.toAIStreamResponse();
  return response;
}