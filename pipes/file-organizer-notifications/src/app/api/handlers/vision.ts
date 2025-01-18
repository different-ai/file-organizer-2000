import { VisionEvent } from "@screenpipe/js";

// Global variable to store event handlers
const eventHandlers: ((event: VisionEvent) => void)[] = [];

export function addVisionEventHandler(handler: (event: VisionEvent) => void) {
  console.log("Registering new vision handler");
  eventHandlers.push(handler);
  console.log("Total vision handlers:", eventHandlers.length);
}

export function getVisionHandlers() {
  return eventHandlers;
}

// Initialize vision stream if not already done
if (typeof window === 'undefined') { // Only run on server
  const { pipe } = require("@screenpipe/js");
  pipe.streamVision({
    onEvent: (event: VisionEvent) => {
      eventHandlers.forEach(handler => handler(event));
    },
  });
}
