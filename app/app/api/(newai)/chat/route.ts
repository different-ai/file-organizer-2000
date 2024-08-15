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

    const contextString = unifiedContext
      .map((file) => {
        return `File: ${file.title}\n\nContent:\n${file.content}\nPath: ${file.path} Reference: ${file.reference}`;
      })
      .join("\n\n");

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-2024-08-06", {
        structuredOutputs: true,
      }),
      system: `You are a helpful assistant with access to various files, notes, and YouTube video transcripts. Your context includes:

${contextString}

Use this context to inform your responses. Key points:

1. For YouTube videos, refer to them by title and use transcript information.
2. For other queries, use the context without explicitly mentioning files unless necessary.
3. Understand that '#' in queries refers to tags in the system, which will be provided in the context.
4. When asked to "format" or "summarize" without specific content, assume it refers to the entire current context.

Use these reference formats:
- Obsidian-style: [[Filename]], [[Filename#Header]], [[Filename#^unique-identifier]]
- YouTube videos: [YouTube: Video Title]
- General references: [^1^]
- Quotes: "quoted text"[^2^]

Always use these formats when referencing context items. Use numbered references and provide sources at the end of your response.

Recognize and handle requests like:
- "Format this as markdown": Apply to the entire current context
- "Summarize all my #startup notes": Focus on notes tagged with #startup

Adapt to various formatting, summarization, or content-specific requests based on the user's input and available context.`,
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