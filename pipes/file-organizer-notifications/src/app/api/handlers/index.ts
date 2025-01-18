// Import and register all handlers here
import { addTranscriptionHandler } from "./transcription";
import { pipe, TranscriptionData } from "@screenpipe/js";
import * as fs from "fs/promises";
import * as path from "path";

// Default settings
const defaultSettings = {
  path: "/home/ubuntu/repos/file-organizer-2000/pipes/file-organizer-notifications/test/obsidian",
  interval: 3600000,
  pageSize: 100,
  aiModel: "gpt-4"
};

// Register meeting notes handler and initialize streams
if (typeof window === 'undefined') {
  console.log("Initializing transcription stream at server startup...");
  pipe.streamTranscriptions({
    onData: (data: TranscriptionData) => {
      console.log("Received transcription data at startup:", {
        transcription: data.transcription?.substring(0, 100) + "...",
        confidence: data.confidence,
        timestamp: data.timestamp
      });
    },
    onError: (err) => console.error("Transcription error at startup:", err),
  });

  console.log("Registering meeting notes handler from handlers/index.ts...");
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
      
      // Ensure directory exists
      const normalizedPath = path.normalize(notesPath);
      const meetingNotesPath = path.join(normalizedPath, "meeting-notes");
      await fs.mkdir(meetingNotesPath, { recursive: true });

      const today = new Date();
      const filename = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-meeting.md`;
      const filePath = path.join(meetingNotesPath, filename);

      const vaultName = path.basename(path.resolve(normalizedPath));
      const timestamp = today.toLocaleTimeString();
      const confidenceStr = data.confidence ? ` (confidence: ${(data.confidence * 100).toFixed(1)}%)` : '';

      try {
        await fs.access(filePath);
        await fs.appendFile(
          filePath,
          `\n\n## ${timestamp}${confidenceStr}\n${data.transcription}`,
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
${data.transcription}`;
        await fs.writeFile(filePath, content, "utf8");
      }

      const deepLink = `obsidian://open?vault=${encodeURIComponent(
        vaultName
      )}&file=${encodeURIComponent(`meeting-notes/${filename}`)}`;
      
      console.log("Meeting notes synced successfully, deep link:", deepLink);
      return deepLink;
    } catch (error) {
      console.error("Failed to sync meeting notes:", error);
      throw error;
    }
  };

  addTranscriptionHandler(handler);
  console.log("Meeting notes handler registered successfully");
}
