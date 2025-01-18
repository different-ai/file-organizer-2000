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
    confidence: z.number().optional(),
  }),
});

type StreamEvent = z.infer<typeof baseEvent>;

// Type for stream errors
interface StreamError {
  message: string;
  code?: string;
}

// Default settings
const defaultSettings = {
  path: "/home/ubuntu/repos/file-organizer-2000/pipes/file-organizer-notifications/test/obsidian",
  interval: 3600000,
  pageSize: 100,
  aiModel: "gpt-4"
};

// Get settings synchronously for handler registration
let obsidianPath: string;
try {
  obsidianPath = defaultSettings.path;
  // Ensure directory exists
  fs.mkdir(path.join(obsidianPath, "meeting-notes"), { recursive: true }).catch(console.error);
} catch (error) {
  console.error("Failed to initialize obsidian path:", error);
}

// Import handler registration function
import { addTranscriptionHandler } from "../handlers/transcription";

// Register handler at module level
if (typeof window === 'undefined') { // Only run on server
  const handler = async (data: TranscriptionData) => {
    console.log("Meeting notes handler called with data:", {
      transcription: data.transcription?.substring(0, 100) + "...",
      confidence: data.confidence,
      timestamp: data.timestamp
    });
    
    try {
      // Get current settings
      const settings = await pipe.settings.getNamespaceSettings("obsidian");
      const effectiveSettings = settings?.settings?.obsidian || settings || defaultSettings;
      const notesPath = effectiveSettings.path || defaultSettings.path;
      
      console.log("Using notes path:", notesPath);
      const deepLink = await syncMeetingNotes(data.transcription, notesPath, data.confidence);
      console.log("Meeting notes synced successfully, deep link:", deepLink);
      return deepLink;
    } catch (error) {
      console.error("Failed to sync meeting notes:", error);
      throw error;
    }
  };

  // Register the handler
  console.log("Adding meeting notes handler to registry...");
  addTranscriptionHandler(handler);
  console.log("Meeting notes handler registered successfully");
}

async function syncMeetingNotes(
  transcription: string,
  obsidianPath: string,
  confidence?: number
): Promise<string> {
  console.log("Syncing meeting notes:", {
    obsidianPath,
    transcriptionLength: transcription.length,
    confidence
  });
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
  const confidenceStr = confidence ? ` (confidence: ${(confidence * 100).toFixed(1)}%)` : '';

  try {
    await fs.access(filePath);
    await fs.appendFile(
      filePath,
      `\n\n## ${timestamp}${confidenceStr}\n${transcription}`,
      "utf8"
    );
  } catch {
    const content = `---
date: ${today.toISOString()}
type: meeting-notes
tags: [meeting, transcription]
---

# Meeting Notes - ${today.toLocaleDateString()}

## ${timestamp}${confidenceStr}
${transcription}`;
    await fs.writeFile(filePath, content, "utf8");
  }

  return `obsidian://open?vault=${encodeURIComponent(
    vaultName
  )}&file=${encodeURIComponent(`meeting-notes/${filename}`)}`;
}

export async function GET() {
  console.log("Starting GET request handler for meeting notes...");
  try {
    console.log("Setting up error handlers...");
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    console.log("Fetching settings...");
    const settings = await pipe.settings.getNamespaceSettings("obsidian");
    console.log("Retrieved settings:", settings);
    
    // Default settings
    const defaultSettings = {
      path: "/home/ubuntu/repos/file-organizer-2000/pipes/file-organizer-notifications/test/obsidian",
      interval: 3600000,
      pageSize: 100,
      aiModel: "gpt-4"
    };
    
    // Try to get settings from different locations
    const effectiveSettings = settings?.settings?.obsidian || settings || defaultSettings;
    console.log("Using effective settings:", effectiveSettings);
    
    const obsidianPath = effectiveSettings.path;
    const interval = effectiveSettings.interval || 3600000;
    const customPrompt = effectiveSettings.prompt;
    const pageSize = effectiveSettings.pageSize || 100;
    const model = effectiveSettings.aiModel;

    if (!obsidianPath) {
      console.error("Obsidian settings not found:", settings);
      return NextResponse.json(
        { error: "obsidian path not configured", debug: { settings } },
        { status: 400 }
      );
    }

    // Ensure meeting notes directory exists
    const meetingNotesPath = path.join(obsidianPath, "meeting-notes");
    await fs.mkdir(meetingNotesPath, { recursive: true });

    console.log("Setting up SSE stream...");
    
    // Start transcription stream
    pipe.streamTranscriptions({
      onData: async (data: TranscriptionData) => {
        try {
          const deepLink = await syncMeetingNotes(data.transcription, obsidianPath, data.confidence);
          console.log("Meeting notes synced successfully, deep link:", deepLink);
        } catch (error) {
          console.error("Failed to process transcription:", error);
        }
      },
      onError: (error: StreamError) => {
        console.error("Transcription stream error:", error.message);
      },
    });
    
    // Initialize SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send SSE events
          const sendEvent = async (event: StreamEvent) => {
            try {
              console.log("Sending SSE event:", event);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch (error) {
              console.error("Failed to send SSE event:", error);
              controller.error(error);
            }
          };

          // Send initial connection event
          await sendEvent({
            type: "transcription",
            data: {
              message: "SSE connection established",
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error("Error in stream start:", error);
          controller.error(error);
        }
      },
      cancel() {
        console.log("SSE connection closed");
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*"
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
