import { pipe, VisionEvent } from "@screenpipe/js";
import { z } from "zod";
import { addVisionEventHandler } from "../handlers/vision";

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
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send SSE events
          const sendEvent = async (event: MeetingEvent) => {
            try {
              console.log("Sending SSE event:", event);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch (error) {
              console.error("Failed to send SSE event:", error);
              controller.error(error);
            }
          };

          // Create and register handler for meeting detection
          const handleVisionEvent = async (event: VisionEvent) => {
            if (isZoomMeeting(event.app_name, event.window_name)) {
              await sendEvent({
                type: "meeting_started",
                message: "A meeting just started open file organizer 2000",
                timestamp: new Date().toISOString(),
                app_name: event.app_name,
                window_name: event.window_name,
              });
            }
          };

          // Register the handler
          if (typeof window === 'undefined') {
            addVisionEventHandler(handleVisionEvent);
          }

          // Send initial connection event
          await sendEvent({
            type: "meeting_started",
            message: "SSE connection established for meeting detection",
            timestamp: new Date().toISOString(),
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
    console.error("Error in meeting detection api:", error);
    return new Response(
      JSON.stringify({ error: `Failed to process meeting detection: ${error}` }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
