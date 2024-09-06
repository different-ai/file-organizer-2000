import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, formattingInstruction } = await request.json();

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || 'gpt-4'),
      system: "Answer directly in markdown",
      messages: [
        {
          role: 'user',
          content: `Format the following content according to the given instruction, only use context if needed for the formatting instruction:
Context:
  Time: ${new Date().toISOString()}

Content:
"${content}"

Formatting Instruction:
"${formattingInstruction}"`
        }
      ],
      onFinish: async ({ usage }) => {
        console.log("Token usage:", usage);
        await incrementAndLogTokenUsage(userId, usage.totalTokens);
      },
    });

    const response = result.toTextStreamResponse();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
