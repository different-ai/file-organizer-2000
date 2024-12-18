import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";

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
    const {
      messages,
      newUnifiedContext,
      enableScreenpipe,
      currentDatetime,
      unifiedContext: oldUnifiedContext,
    } = await req.json();

    // if oldunified context do what is below if not just return newunified context
    const contextString =
      newUnifiedContext ||
      oldUnifiedContext
        ?.map((file) => {
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
      maxSteps: 3,
      messages: convertToCoreMessages(messages),
      tools: {
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
        onboardUser: {
          description: "Onboard the user to the vault",
          parameters: z.object({}),
        },
        appendContentToFile: {
          description: "Append content to a file with user confirmation",
          parameters: z.object({
            content: z.string().describe("The content to append to the file"),
            message: z
              .string()
              .describe("Message to show to the user for confirmation"),
            fileName: z
              .string()
              .optional()
              .describe("Optional specific file to append to"),
          }),
        },
        generateSettings: {
          description:
            "Generate vault organization settings based on user preferences",
          parameters: settingsSchema,
        },
        analyzeVaultStructure: {
          description: "Analyze vault structure to suggest organization improvements",
          parameters: z.object({
            path: z.string().describe("Path to analyze. Use '/' for all files or specific folder path"),
            maxDepth: z.number().optional().describe("Maximum depth to analyze"),
            addToContext: z.boolean().optional().describe("Whether to add analyzed files to context")
          }),
        },
        getScreenpipeDailySummary: {
          description: "Get a summary of the user's day using Screenpipe data",
          parameters: z.object({
            startTime: z.string().optional().describe("Start time in ISO format"),
            endTime: z.string().optional().describe("End time in ISO format"),
          }),
        },
        moveFiles: {
          description: "Move files to their designated folders",
          parameters: z.object({
            moves: z.array(z.object({
              sourcePath: z.string().describe("Source path (e.g., '/' for root, or specific folder path)"),
              destinationPath: z.string().describe("Destination folder path"),
              pattern: z.object({
                namePattern: z.string().optional().describe("File name pattern to match (e.g., 'untitled-*')"),
                extension: z.string().optional().describe("File extension to match")
              }).optional()
            })),
            message: z.string().describe("Confirmation message to show user")
          }),
        },
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
