import { NextResponse } from "next/server";
import { VisionEvent } from "@screenpipe/js";
import { getVisionHandlers } from "../handlers/vision";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create a test vision event
    const event: VisionEvent = {
      app_name: body.app_name || "",
      window_name: body.window_name || "",
      timestamp: body.timestamp || new Date().toISOString(),
    };

    // Get handlers and simulate the event
    const handlers = getVisionHandlers();
    handlers.forEach(handler => handler(event));

    return NextResponse.json({ 
      message: "Test event sent successfully",
      event 
    });
  } catch (error) {
    console.error("Error in test vision api:", error);
    return NextResponse.json(
      { error: `Failed to send test event: ${error}` },
      { status: 500 }
    );
  }
}
