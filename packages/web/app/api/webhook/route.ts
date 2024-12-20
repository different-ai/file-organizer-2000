import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "./verify";
import { handleSubscriptionUpdated } from "./handlers/subscription-updated";
import { handleSubscriptionCanceled } from "./handlers/subscription-canceled";
import { handleCheckoutComplete } from "./handlers/checkout-complete";
import { handleInvoicePaid } from "./handlers/invoice-paid";
import { handlePaymentIntentSucceeded } from "./handlers/payment-intent-succeeded";
import { handleInvoicePaymentFailed } from "./handlers/invoice-payment-failed";
import { validateWebhookMetadata } from "@/srm.config";

const HANDLERS = {
  "checkout.session.completed": handleCheckoutComplete,
  "customer.subscription.deleted": handleSubscriptionCanceled,
  "customer.subscription.updated": handleSubscriptionUpdated,
  // "invoice.paid": handleInvoicePaid,
  "invoice.payment_failed": handleInvoicePaymentFailed,
  // "payment_intent.succeeded": handlePaymentIntentSucceeded,
} as const;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const event = await verifyStripeWebhook(req);
    const handler = HANDLERS[event.type as keyof typeof HANDLERS];

    // Use the validateWebhookMetadata helper from srm.config
    const metadata = event.data.object.metadata;
    if (metadata && !validateWebhookMetadata(metadata)) {
      console.warn(`Invalid metadata for event ${event.type}`);
      // Continue processing as some events may not need complete metadata
    }

    if (!handler) {
      console.log(`Unhandled webhook event type: ${event.type}`);
      return NextResponse.json({ message: `Unhandled event type: ${event.type}` }, { status: 200 });
    }

    const result = await handler(event);

    if (!result.success) {
      console.error({
        message: `Webhook ${event.type} processing failed`,
        error: result.error,
        eventId: event.id,
        duration: Date.now() - startTime,
      });
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      duration: Date.now() - startTime,
    });

  } catch (error) {
    console.error({
      message: "Webhook processing error",
      error,
      duration: Date.now() - startTime,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
