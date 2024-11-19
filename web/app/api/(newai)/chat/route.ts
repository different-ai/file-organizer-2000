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

const settingsSchema = z.object({
  renameInstructions: z.string().optional(),
  customFolderInstructions: z.string().optional(),
  imageInstructions: z.string().optional(),
});

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
      system: getChatSystemPrompt(
        contextString,
        enableScreenpipe,
        currentDatetime
      ),
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
        generateSettings: {
          description:
            "Generate vault organization settings based on user preferences",
          parameters: settingsSchema,
        },
        ...(enableScreenpipe && {
          getScreenpipeDailySummary: {
            description:
              "Get a summary of the user's day using Screenpipe data",
            parameters: z.object({}),
          },
        }),
      },
      onFinish: async ({ usage }) => {
        console.log("Token usage:", usage);
        await incrementAndLogTokenUsage(userId, usage.totalTokens);
      },
    });

    const response = result.toDataStreamResponse();
    return response;
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: error.status || 500 }
    );
  }
}
