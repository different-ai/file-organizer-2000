import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await handleAuthorization(req);
    const { messages, unifiedContext } = await req.json();

    const contextString = unifiedContext
      .map(file => `File: ${file.title}\n\nContent:\n${file.content}`)
      .join('\n\n');

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-mini"),
      system: `You are a helpful assistant. Here's some context about the current workspace:
${contextString}
Please use this context to inform your responses, but do not directly repeat this context in your answers unless specifically asked about the file content.`,
      messages: convertToCoreMessages(messages),
      tools: {
        getNotesForDateRange: {
          description: 'Get notes within a specified date range',
          parameters: z.object({
            startDate: z.string().describe('Start date of the range (ISO format)'),
            endDate: z.string().describe('End date of the range (ISO format)'),
          }),
        },
      },
      onFinish: async ({ usage }) => {
        console.log("Token usage:", usage);
        await incrementAndLogTokenUsage(userId, usage.totalTokens);
      },
    });

    const response = result.toDataStreamResponse();

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}