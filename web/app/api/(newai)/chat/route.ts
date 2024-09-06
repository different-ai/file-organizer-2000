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
    const { messages, unifiedContext, enableScreenpipe, currentDatetime } = await req.json();
    console.log(enableScreenpipe, "enableScreenpipe");
    console.log(currentDatetime, "currentDatetime");

    const contextString = unifiedContext
      .map((file) => {
        return `File: ${file.title}\n\nContent:\n${file.content}\nPath: ${file.path} Reference: ${file.reference}`;
      })
      .join("\n\n");

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-2024-08-06", {
        structuredOutputs: true,
      }),
      system: `You are a helpful assistant with access to various files, notes, YouTube video transcripts, and Screenpipe data. Your context includes:

${contextString}

Use this context to inform your responses. Key points:

1. For YouTube videos, refer to them by title and use transcript information.
2. For other queries, use the context without explicitly mentioning files unless necessary.
3. Understand that '#' in queries refers to tags in the system, which will be provided in the context.
4. When asked to "format" or "summarize" without specific content, assume it refers to the entire current context.
${enableScreenpipe ? '5. For Screenpipe-related queries, use the provided tools to fetch and analyze meeting summaries or daily information.' : ''}

The current date and time is: ${currentDatetime}

Use these reference formats:
- Obsidian-style: [[Filename]], [[Filename#Header]], [[Filename#^unique-identifier]]
- YouTube videos: [YouTube: Video Title]
- General references: [^1^]
- Quotes: "quoted text"[^2^]

Always use these formats when referencing context items. Use numbered references and provide sources at the end of your response.

Recognize and handle requests like:
- "Summarize the meeting I had just now": Use the summarizeMeeting tool
- "Summarize my day": Use the getDailyInformation tool
Adapt to various summarization or content-specific requests based on the user's input and available context.`,
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
        ...(enableScreenpipe ? {
          summarizeMeeting: {
            description: "Summarize a recent meeting using Screenpipe audio data",
            parameters: z.object({
              duration: z.number().describe("Duration of the meeting in minutes (default: 60)").default(60),
            }),
            execute: async ({ duration }) => {
              // This will be handled client-side
              return JSON.stringify({ duration });
            },
          },
          getDailyInformation: {
            description: "Get information about the user's day using Screenpipe data",
            parameters: z.object({
              date: z.string().describe("The date to analyze (ISO format, default: today)").optional(),
            }),
            execute: async ({ date }) => {
              // This will be handled client-side
              return JSON.stringify({ date: date || new Date().toISOString().split('T')[0] });
            },
          },
        } : {}),
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
