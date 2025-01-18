import { TranscriptionData } from "@screenpipe/js";

// Type for transcription handlers that can return string (e.g. deep links) or void
type TranscriptionHandler = (data: TranscriptionData) => Promise<string | void>;

// Global variable to store transcription handlers
const transcriptionHandlers: TranscriptionHandler[] = [];

export function addTranscriptionHandler(handler: TranscriptionHandler) {
  console.log("Registering new transcription handler");
  transcriptionHandlers.push(handler);
  console.log("Total handlers:", transcriptionHandlers.length);
  
  // Debug: Print all registered handlers
  transcriptionHandlers.forEach((h, i) => {
    console.log(`Handler ${i + 1}:`, h.toString());
  });
}

export function getTranscriptionHandlers() {
  return transcriptionHandlers;
}
