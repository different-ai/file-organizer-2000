import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from '@/lib/models';
import { ollama } from "ollama-ai-provider";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, formattingInstruction, model: requestModel } = await request.json();
    const model = requestModel === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(requestModel || process.env.MODEL_NAME);

    const result = await streamText({
      model,
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

