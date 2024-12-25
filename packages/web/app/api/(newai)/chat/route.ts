import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";

import { getModel } from "@/lib/models";
import { getChatSystemPrompt } from "@/lib/prompts/chat-prompt";

export const maxDuration = 60;
const settingsSchema = z.object({
  renameInstructions: z.string().optional(),
  customFolderInstructions: z.string().optional(),
  imageInstructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await handleAuthorization(req);
    const {
      messages,
      newUnifiedContext,
      enableScreenpipe,
      currentDatetime,
      unifiedContext: oldUnifiedContext,
      model: bodyModel,
    } = await req.json();

    const chosenModelName = 
      bodyModel ?? 
      process.env.CHAT_MODEL ?? 
      process.env.MODEL_NAME ?? 
      "gemini-2.0-flash-exp";
    console.log("Chat using model:", chosenModelName);
    const model = getModel(chosenModelName);

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
        searchByName: {
          description: "Search for files by name pattern",
          parameters: z.object({
            query: z
              .string()
              .describe("The name pattern to search for (e.g., 'Untitled*' or exact name)"),
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
        renameFiles: {
          description: "Rename files based on pattern or criteria",
          parameters: z.object({
            files: z.array(z.object({
              oldPath: z.string().describe("The current full path of the file"),
              newName: z.string().describe("Proposed new file name (no directories)")
            })),
            message: z.string().describe("Confirmation message to show user")
          }),
        },
        executeActionsOnFileBasedOnPrompt: {
          description: "Analyze file content and apply one of (recommendTags & appendTag), (recommendFolders & moveFile), or (recommendName & moveFile)",
          parameters: z.object({
            filePaths: z.array(z.string()).describe("List of file paths to analyze"),
            userPrompt: z.string().describe("User instructions to decide how to rename or re-tag or re-folder the files")
          }),
        },
      },
      onFinish: async ({ usage, providerMetadata }) => {
        console.log("Token usage:", usage);
        const googleMetadata = providerMetadata?.google;
        console.log("Search Grounding Metadata:", googleMetadata?.groundingMetadata);
        
        // Send the grounding metadata as a special data chunk
        result.appendDataChunk({
          type: 'metadata',
          data: {
            groundingMetadata: googleMetadata?.groundingMetadata
          }
        });
        
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
