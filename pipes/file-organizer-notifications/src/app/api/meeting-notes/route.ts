import { NextResponse } from "next/server";
import { pipe, TranscriptionData } from "@screenpipe/js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

// Schema for events
const baseEvent = z.object({
  type: z.union([z.literal("transcription"), z.literal("error")]),
  data: z.object({
    timestamp: z.string().optional(),
    text: z.string().optional(),
    deepLink: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),
});

type StreamEvent = z.infer<typeof baseEvent>;

// Type for stream errors
interface StreamError {
  message: string;
  code?: string;
}

async function syncMeetingNotes(
  transcription: string,
  obsidianPath: string
): Promise<string> {
  const normalizedPath = path.normalize(obsidianPath);
  const meetingNotesPath = path.join(normalizedPath, "meeting-notes");
  await fs.mkdir(meetingNotesPath, { recursive: true });

  const today = new Date();
  const filename = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-meeting.md`;
  const filePath = path.join(meetingNotesPath, filename);

  const vaultName = path.basename(path.resolve(normalizedPath));
  const timestamp = today.toLocaleTimeString();

  try {
    await fs.access(filePath);
    await fs.appendFile(filePath, `\n\n${timestamp}: ${transcription}`, "utf8");
  } catch {
    const content = `---
date: ${today.toISOString()}
type: meeting-notes
---

# Meeting Notes - ${today.toLocaleDateString()}

${timestamp}: ${transcription}`;
    await fs.writeFile(filePath, content, "utf8");
  }

  return `obsidian://open?vault=${encodeURIComponent(
    vaultName
  )}&file=${encodeURIComponent(`meeting-notes/${filename}`)}`;
}

export async function GET() {
  try {
    const settings = await pipe.settings.getNamespaceSettings("obsidian");
    const obsidianPath = settings?.path;

    if (!obsidianPath) {
      return NextResponse.json(
        { error: "obsidian path not configured" },
        { status: 400 }
      );
    }

    // Initialize SSE response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: StreamEvent) => {
      try {
        const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
        await writer.write(data);
      } catch (error) {
        console.error("Failed to send SSE event:", error);
      }
    };

    // Start transcription stream
    pipe.streamTranscriptions({
      onData: async (data: TranscriptionData) => {
        try {
          const deepLink = await syncMeetingNotes(data.transcription, obsidianPath);
          await sendEvent({
            type: "transcription",
            data: {
              text: data.transcription,
              timestamp: new Date().toISOString(),
              deepLink,
            },
          });
        } catch (error) {
          console.error("Failed to process transcription:", error);
          await sendEvent({
            type: "error",
            data: {
              message: "Failed to process transcription",
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      },
      onError: (error: StreamError) => {
        console.error("Transcription stream error:", error.message);
      },
    });

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in meeting notes api:", error);
    return NextResponse.json(
      { error: `Failed to process meeting notes: ${error}` },
      { status: 500 }
    );
  }
}
