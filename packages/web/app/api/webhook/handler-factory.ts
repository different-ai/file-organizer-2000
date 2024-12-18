import { WebhookEvent, WebhookHandlerResponse } from "./types";

export function createWebhookHandler(
  handlerFn: (event: WebhookEvent) => Promise<WebhookHandlerResponse>,
  options: {
    requiredMetadata?: string[];
    idempotencyKey?: (event: WebhookEvent) => string;
  } = {}
) {
  return async (event: WebhookEvent): Promise<WebhookHandlerResponse> => {
    const startTime = Date.now();
    const eventId = event.data.object.id;

    try {
      // Validate required metadata
      if (options.requiredMetadata) {
        const metadata = event.data.object.metadata || {};
        const missingFields = options.requiredMetadata.filter(
          (field) => !metadata[field]
        );

        if (missingFields.length > 0) {
          throw new Error(
            `Missing required metadata fields: ${missingFields.join(", ")}`
          );
        }
      }

      // Execute handler
      const result = await handlerFn(event);

      // Log success
      console.log({
        message: `Webhook ${event.type} processed successfully`,
        eventId,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Log error
      console.error({
        message: `Webhook ${event.type} processing failed`,
        eventId,
        error,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        message: error.message,
        error,
      };
    }
  };
}
