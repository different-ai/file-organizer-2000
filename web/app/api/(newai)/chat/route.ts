import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";
import { parseISO, isValid } from "date-fns";

import { ollama } from "ollama-ai-provider";
import { getModel } from "@/lib/models";

export const maxDuration = 60;
const USE_LLAMA_FOR_CHAT = process.env.USE_LLAMA_FOR_CHAT === "true";
const MODEL_NAME = USE_LLAMA_FOR_CHAT
  ? process.env.OLLAMA_MODEL
  : process.env.MODEL_NAME;

export async function POST(req: NextRequest) {
  const useLLama = USE_LLAMA_FOR_CHAT;
  console.log("Chat:");
  console.log("Using llama for chat:", useLLama);
  console.log("Using model for chat:", MODEL_NAME);
  const model = useLLama ? ollama(MODEL_NAME) : getModel(MODEL_NAME);
  try {
    const { userId } = await handleAuthorization(req);
    const { messages, unifiedContext, enableScreenpipe, currentDatetime } =
      await req.json();
    console.log(enableScreenpipe, "enableScreenpipe");
    console.log(currentDatetime, "currentDatetime");

    const contextString = unifiedContext
      .map((file) => {
        return `File: ${file.title}\n\nContent:\n${file.content}\nPath: ${file.path} Reference: ${file.reference}`;
      })
      .join("\n\n");

    const result = await streamText({
      model,
      system: `You are a helpful assistant with access to various files, notes, YouTube video transcripts, and Screenpipe data. Your context includes:

${contextString}

Use this context to inform your responses. Key points:

1. For YouTube videos, refer to them by title and use transcript information.
2. For other queries, use the context without explicitly mentioning files unless necessary.
3. Understand that '#' in queries refers to tags in the system, which will be provided in the context.
4. When asked to "format" or "summarize" without specific content, assume it refers to the entire current context.
${
  enableScreenpipe
    ? "5. For Screenpipe-related queries, use the provided tools to fetch and analyze meeting summaries or daily information."
    : ""
}

The current date and time is: ${currentDatetime}

Use these reference formats:
- Obsidian-style: [[File/Path]], [[Filename#Header]], [[Filename#^unique-identifier]]
- When you mention a file always reference it by path and output like this [[File/Path]]
- YouTube videos: [YouTube: Video Title]
- General references: [^1^]
- Quotes: "quoted text"[^2^]

Always use these formats when referencing context items. Use numbered references and provide sources at the end of your response.

Recognize and handle requests like:
- "Summarize the meeting I had just now": Use the summarizeMeeting tool
- "Summarize my day": Use the getDailyInformation tool
Adapt to various summarization or content-specific requests based on the user's input and available context.

only use tools if the user asks for them.

`,
      messages: convertToCoreMessages(messages),
      // Only include tools if not using Llama
      tools: useLLama
        ? undefined
        : {
            getNotesForDateRange: {
              description: `If user asks for notes related to a date, get notes within a specified date range. Today is ${
                new Date().toISOString().split("T")[0]
              }`,
              parameters: z.object({
                startDate: z
                  .string()
                  .describe("Start date of the range (ISO format)")
                  .refine((date) => isValid(parseISO(date)), {
                    message: "Invalid start date format",
                  }),
                endDate: z
                  .string()
                  .describe("End date of the range (ISO format)")
                  .refine((date) => isValid(parseISO(date)), {
                    message: "Invalid end date format",
                  }),
              }),
            },
            getSearchQuery: {
              description: "Extract queries to search for notes",
              parameters: z.object({
                query: z
                  .string()
                  .describe("The search query to find relevant notes"),
              }),
            },
            getYoutubeVideoId: {
              description: "Get the YouTube video ID from a URL",
              parameters: z.object({
                videoId: z.string().describe("The YouTube video ID"),
              }),
            },
            getLastModifiedFiles: {
              description: "Get the last modified files in the vault",
              parameters: z.object({
                count: z
                  .number()
                  .describe("The number of last modified files to retrieve"),
              }),
            },
            ...(enableScreenpipe
              ? {
                  summarizeMeeting: {
                    description:
                      "Summarize a recent meeting using Screenpipe audio data",
                    parameters: z.object({
                      duration: z
                        .number()
                        .describe(
                          "Duration of the meeting in minutes (default: 60)"
                        )
                        .default(60),
                    }),
                    execute: async ({ duration }) => {
                      // This will be handled client-side
                      return JSON.stringify({ duration });
                    },
                  },
                  getDailyInformation: {
                    description:
                      "Get information about the user's day using Screenpipe data",
                    parameters: z.object({
                      date: z
                        .string()
                        .describe(
                          "The date to analyze (ISO format, default: today)"
                        )
                        .optional(),
                    }),
                    execute: async ({ date }) => {
                      // This will be handled client-side
                      return JSON.stringify({
                        date: date || new Date().toISOString().split("T")[0],
                      });
                    },
                  },
                }
              : {}),
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
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: error.status || 500 }
    );
  }
}
