import { convertToCoreMessages, streamText, createDataStreamResponse, generateId } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { z } from "zod";

import { getModel } from "@/lib/models";
import { getChatSystemPrompt } from "@/lib/prompts/chat-prompt";

interface GroundingMetadataItem {
  content: string;
  title: string;
  relevanceScore: number;
}

export const maxDuration = 60;
const settingsSchema = z.object({
  renameInstructions: z.string().optional(),
  customFolderInstructions: z.string().optional(),
  imageInstructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return createDataStreamResponse({
    execute: async (dataStream) => {
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

        const chosenModelName = bodyModel;
        console.log("Chat using model:", chosenModelName);
        const model = getModel(chosenModelName);

        const contextString =
          newUnifiedContext ||
          oldUnifiedContext
            ?.map((file) => {
              return `File: ${file.title}\n\nContent:\n${file.content}\nPath: ${file.path} Reference: ${file.reference}`;
            })
            .join("\n\n");

        dataStream.writeData('initialized call');

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
              description: "Extract semantic search queries to find relevant notes based on content and meaning",
              parameters: z.object({
                query: z.string().describe("The semantic search query to find relevant notes"),
              }),
            },
            searchByName: {
              description: "Search for files by name pattern or exact match, useful for finding specific notes or groups of notes",
              parameters: z.object({
                query: z.string().describe("The name pattern to search for (e.g., 'Untitled*', 'daily-*', or exact name)"),
              }),
            },
            getYoutubeVideoId: {
              description: "Extract YouTube video ID to import and organize video content into notes",
              parameters: z.object({
                videoId: z.string().describe("The YouTube video ID"),
              }),
            },
            getLastModifiedFiles: {
              description: "Retrieve recently modified files to track changes and activity in the vault",
              parameters: z.object({
                count: z.number().describe("The number of last modified files to retrieve"),
              }),
            },
            onboardUser: {
              description: "Guide new users through vault setup and organization best practices",
              parameters: z.object({}),
            },
            appendContentToFile: {
              description: "Add new content to existing notes while preserving structure and formatting",
              parameters: z.object({
                content: z.string().describe("The formatted content to append to the file"),
                message: z.string().describe("Clear explanation of what content will be added"),
                fileName: z.string().optional().describe("Optional specific file to append to"),
              }),
            },
            addTextToDocument: {
              description: "Add new sections or content to notes with proper formatting and structure",
              parameters: z.object({
                content: z.string().describe("The formatted text content to add"),
                path: z.string().optional().describe("Optional path to the document. If not provided, uses current document"),
              }),
            },
            modifyDocumentText: {
              description: "Edit existing note content while maintaining consistency and structure",
              parameters: z.object({
                content: z.string().describe("The new formatted content to replace existing content"),
                path: z.string().optional().describe("Optional path to the document. If not provided, uses current document"),
              }),
            },
            generateSettings: {
              description: "Create personalized vault organization settings based on user preferences and best practices",
              parameters: settingsSchema,
            },
            analyzeVaultStructure: {
              description: "Analyze vault organization and provide actionable improvement suggestions",
              parameters: z.object({
                path: z.string().describe("Path to analyze. Use '/' for all files or specific folder path"),
                maxDepth: z.number().optional().describe("Maximum folder depth to analyze"),
                addToContext: z.boolean().optional().describe("Whether to add analyzed files to context"),
              }),
            },
            getScreenpipeDailySummary: {
              description: "Generate comprehensive daily summaries from Screenpipe data with key insights and activities",
              parameters: z.object({
                startTime: z.string().optional().describe("Start time in ISO format"),
                endTime: z.string().optional().describe("End time in ISO format"),
              }),
            },
            moveFiles: {
              description: "Organize files into appropriate folders based on content and structure",
              parameters: z.object({
                moves: z.array(
                  z.object({
                    sourcePath: z.string().describe("Source path (e.g., '/' for root, or specific folder path)"),
                    destinationPath: z.string().describe("Destination folder path"),
                    pattern: z.object({
                      namePattern: z.string().optional().describe("File name pattern to match (e.g., 'untitled-*', 'daily-*')"),
                      extension: z.string().optional().describe("File extension to match"),
                    }).optional(),
                  })
                ),
                message: z.string().describe("Clear explanation of the proposed file organization"),
              }),
            },
            renameFiles: {
              description: "Rename files intelligently based on content and organizational patterns",
              parameters: z.object({
                files: z.array(
                  z.object({
                    oldPath: z.string().describe("Current full path of the file"),
                    newName: z.string().describe("Descriptive new file name based on content"),
                  })
                ),
                message: z.string().describe("Clear explanation of the naming strategy"),
              }),
            },
            executeActionsOnFileBasedOnPrompt: {
              description: "Analyze and organize files through tagging, moving, or renaming based on content analysis",
              parameters: z.object({
                filePaths: z.array(z.string()).describe("List of file paths to analyze and organize"),
                userPrompt: z.string().describe("Specific instructions for file organization strategy"),
              }),
            },
          },
          onFinish: async ({ usage, experimental_providerMetadata }) => {
            console.log("Token usage:", usage);
            const googleMetadata = experimental_providerMetadata?.google as unknown as GoogleGenerativeAIProviderMetadata | undefined;
            console.log("Google metadata:", JSON.stringify(googleMetadata, null, 2));

            if (googleMetadata?.groundingMetadata) {
              dataStream.writeMessageAnnotation({
                type: "search-results",
                groundingMetadata: googleMetadata.groundingMetadata
              });
            }

            await incrementAndLogTokenUsage(userId, usage.totalTokens);
            dataStream.writeData('call completed');
          },
        });

        result.mergeIntoDataStream(dataStream);
      } catch (error) {
        console.error("Error in POST request:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Error in stream:", error);
      return error instanceof Error ? error.message : String(error);
    },
  });
}
