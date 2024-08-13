import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { parseISO, isValid } from "date-fns";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await handleAuthorization(req);
    const { messages, unifiedContext } = await req.json();
    console.log(unifiedContext, "unifiedContext");

    const contextString = unifiedContext
      .map((file) => {
        if (file.path.startsWith('https://www.youtube.com/watch?v=')) {
          return `YouTube Video: ${file.title}\n\nTranscript:\n${file.content}`;
        }
        return `File: ${file.title}\n\nContent:\n${file.content}\nPath: ${file.path}`;
      })
      .join("\n\n");

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-2024-08-06", {
        structuredOutputs: true,
      }),
      system: `You are a helpful assistant with access to the following files and YouTube video transcripts:

${contextString}

Use this context to inform your responses. When asked about YouTube videos:
1. Refer to the video by its title.
2. Use information from the transcript to answer questions about the video content.
3. If asked for timestamps, note that the transcript doesn't include them, so you can only provide general information about the content.

For all other queries, use the context to provide informed answers without explicitly mentioning the files unless necessary.

When referencing files, topics, or YouTube videos from the context, use the following formats:
1. Obsidian-style links:
   - For files: [[Filename]]
   - For headers within files: [[Filename#Header]]
   - For specific text: [[Filename#^unique-identifier]]
2. For YouTube videos: [YouTube: Video Title]
3. Perplexity-like references:
   - For general references: [^1^]
   - For specific quotes: "quoted text"[^2^]

Always use these link and reference formats when mentioning files, specific content from the context, or YouTube videos. Use numbered references (e.g., [^1^], [^2^], etc.) and provide the source information at the end of your response.`,
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
              .refine(date => isValid(parseISO(date)), {
                message: "Invalid start date format",
            }),
            endDate: z
              .string()
              .describe("End date of the range (ISO format)")
              .refine(date => isValid(parseISO(date)), {
                message: "Invalid end date format",
              }),
          }),
          execute: async ({ startDate, endDate }) => {
            console.log(startDate, endDate, "startDate, endDate");
            // Return the date range for client-side processing
            return JSON.stringify({ startDate, endDate });
          },
        },
        searchNotes: {
          description:
            "Search for notes containing specific keywords or phrases",
          parameters: z.object({
            query: z
              .string()
              .describe("The search query to find relevant notes"),
          }),
          execute: async ({ query }) => {
            console.log("Searching notes for:", query);
            // This will be handled client-side, so we just return the query
            return query;
          },
        },
        getYouTubeTranscript: {
          description: "Get the transcript of a YouTube video",
          parameters: z.object({
            videoId: z.string().describe("The YouTube video ID"),
          }),
          execute: async ({ videoId }) => {
            // This will be handled client-side, so we just return the videoId
            return videoId;
          },
        },
        modifyCurrentNote: {
          description:
            "Modify the content of the currently active note using a formatting instruction",
          parameters: z.object({
            formattingInstruction: z
              .string()
              .describe(
                "The instruction for formatting the current note content"
              ),
          }),
          execute: async ({ formattingInstruction }) => {
            // This will be handled client-side, so we just return the formatting instruction
            return formattingInstruction;
          },
        },
        handleUnrecognizedFeature: {
          description: "Handle requests for features that are not specifically implemented",
          parameters: z.object({
            request: z.string().describe("The user's request that wasn't recognized"),
          }),
          execute: async ({ request }) => {
            const response = `I'm not specifically designed to handle "${request}". Here are some examples of what I can do:

1. Search notes: "Find notes about project management"
2. Get notes from a date range: "Get notes from last week"
3. Summarize content: "Summarize the notes about AI"
4. Get YouTube transcripts: "Get the transcript for YouTube video ID abc123"
5. Modify or format notes: "Format the current note as a bullet list"

Feel free to try one of these or ask me anything else!`;
            return response;
          },
        },
        getLastModifiedFiles: {
          description: "Get the last modified files in the vault",
          parameters: z.object({
            count: z.number().describe("The number of last modified files to retrieve"),
          }),
          execute: async ({ count }) => {
            // This will be handled client-side, so we just return the count
            return count.toString();
          },
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
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: error.status || 500 }
    );
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