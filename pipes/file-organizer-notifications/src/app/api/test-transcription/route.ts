import { NextResponse } from "next/server";
import { TranscriptionData } from "@screenpipe/js";
import { addTranscriptionHandler, getTranscriptionHandlers } from "../handlers/transcription";
import "../handlers"; // Import handlers to ensure they're registered

// Register a test handler at module level
if (typeof window === 'undefined') {
  console.log("Registering test handler in test-transcription route...");
  const testHandler = async (data: TranscriptionData) => {
    console.log("Test handler called with data:", data);
    return "Test handler processed data";
  };
  addTranscriptionHandler(testHandler);
}

export async function POST(request: Request) {
  try {
    console.log("Received POST request to test-transcription");
    const body = await request.json();
    console.log("Request body:", body);
    
    // Create a test transcription event
    const transcriptionData: TranscriptionData = {
      transcription: body.transcription || "Test transcription text",
      timestamp: body.timestamp || new Date().toISOString(),
      confidence: body.confidence || 0.95,
    };

    const handlers = getTranscriptionHandlers();
    console.log(`Processing transcription with ${handlers.length} handlers`);
    console.log("Available handlers:", handlers.map(h => h.toString()));
    
    // Process handlers sequentially and collect results
    const results = [];
    for (const handler of handlers) {
      try {
        console.log("Executing handler...");
        console.log("Handler function:", handler.toString());
        const result = await handler(transcriptionData);
        console.log("Handler execution result:", result);
        results.push({ success: true, result });
      } catch (error) {
        console.error("Handler execution failed:", error);
        console.error("Handler that failed:", handler.toString());
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    console.log("All handlers processed. Results:", results);

    return NextResponse.json({ 
      message: "Test transcription processed",
      data: transcriptionData,
      results
    });
  } catch (error) {
    console.error("Error in test transcription api:", error);
    return NextResponse.json(
      { error: `Failed to process test transcription: ${error}` },
      { status: 500 }
    );
  }
}
