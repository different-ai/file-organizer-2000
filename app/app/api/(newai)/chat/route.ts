import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { getYouTubeTranscript } from "@/lib/youtubeTranscript";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await handleAuthorization(req);
    const { messages, unifiedContext } = await req.json();

    const contextString = unifiedContext
      .map((file) => `File: ${file.title}\n\nContent:\n${file.content}`)
      .join("\n\n");

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-2024-08-06", {
        structuredOutputs: true,
      }),
      system: `You are a helpful assistant. Here are some files that you can use to answer questions:
${contextString}
Please use this context to inform your responses, but do not directly repeat this context in your answers unless specifically asked about the file content.`,
      messages: convertToCoreMessages(messages),
      tools: {
        getNotesForDateRange: {
          description: `If user asks for notes related to a date, get notes within a specified date range. Today is ${
            new Date().toISOString().split("T")[0]
          }`,
          parameters: z.object({
            startDate: z
              .string()
              .describe("Start date of the range (ISO format)"),
            endDate: z.string().describe("End date of the range (ISO format)"),
          }),
          execute: async ({ startDate, endDate }) => {
            console.log(startDate, endDate, "startDate, endDate");
            return `Notes fetched for date range: ${startDate} to ${endDate}`;
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
            try {
              const transcript = await getYouTubeTranscript(videoId);
              return transcript;
            } catch (error) {
              console.error("Error fetching YouTube transcript:", error);
              throw new Error(
                `Failed to fetch YouTube transcript: ${error.message}`
              );
            }
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
