import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";
import { parseISO, isValid } from "date-fns";

import { getModel } from "@/lib/models";
import { getChatSystemPrompt } from "@/lib/prompts/chat-prompt";

export const maxDuration = 60;
const MODEL_NAME = process.env.MODEL_NAME;

export async function POST(req: NextRequest) {
  console.log("Chat using model:", MODEL_NAME);
  const model = getModel(MODEL_NAME);
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
      system: getChatSystemPrompt(contextString, enableScreenpipe, currentDatetime),
      messages: convertToCoreMessages(messages),
      tools: {
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
