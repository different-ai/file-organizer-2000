import { NextResponse } from "next/server";
import { pipe, VisionEvent } from "@screenpipe/js";
import { z } from "zod";

// Types for vision stream events
interface StreamError {
  message: string;
  code?: string;
}

// Schema for meeting detection events
const meetingEvent = z.object({
  type: z.literal("meeting_started"),
  message: z.string(),
  timestamp: z.string(),
  app_name: z.string().optional(),
  window_name: z.string().optional(),
});

type MeetingEvent = z.infer<typeof meetingEvent>;

// Helper to check if an app/window is a Zoom meeting
function isZoomMeeting(appName?: string, windowName?: string): boolean {
  if (!appName && !windowName) return false;
  const lowerAppName = appName?.toLowerCase() || "";
  const lowerWindowName = windowName?.toLowerCase() || "";
  return (
    lowerAppName.includes("zoom") ||
    lowerWindowName.includes("zoom meeting")
  );
}

export async function GET() {
  try {
    // Initialize SSE response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: MeetingEvent) => {
      try {
        const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
        await writer.write(data);
      } catch (error) {
        console.error("Failed to send SSE event:", error);
      }
    };

    // Start vision stream for app/window detection
    pipe.streamVision({
      onEvent: async (event: VisionEvent) => {
        if (isZoomMeeting(event.app_name, event.window_name)) {
          // Send meeting started event
          await sendEvent({
            type: "meeting_started",
            message: "A meeting just started open file organizer 2000",
            timestamp: new Date().toISOString(),
            app_name: event.app_name,
            window_name: event.window_name,
          });

          // Log notification
          console.log("Meeting detected:", {
            app: event.app_name,
            window: event.window_name,
            time: new Date().toISOString(),
          });
        }
      },
      onError: (error: StreamError) => {
        console.error("Vision stream error:", error.message);
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
    console.error("Error in meeting detection api:", error);
    return NextResponse.json(
      { error: `Failed to process meeting detection: ${error}` },
      { status: 500 }
    );
  }
}
