import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "./verify";
import { handleSubscriptionUpdated } from "./handlers/subscription-updated";
import { handleSubscriptionCanceled } from "./handlers/subscription-canceled";
import { handleCheckoutComplete } from "./handlers/checkout-complete";
import { handleInvoicePaid } from "./handlers/invoice-paid";
import { handlePaymentIntentSucceeded } from "./handlers/payment-intent-succeeded";

const HANDLERS = {
  "checkout.session.completed": handleCheckoutComplete,
  "customer.subscription.deleted": handleSubscriptionCanceled,
  "invoice.paid": handleInvoicePaid,
  "payment_intent.succeeded": handlePaymentIntentSucceeded,
  "customer.subscription.updated": handleSubscriptionUpdated,
} as const;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const event = await verifyStripeWebhook(req);
    const handler = HANDLERS[event.type as keyof typeof HANDLERS];

    if (!handler) {
      console.log({
        message: `Unhandled webhook event type: ${event.type}`,
        eventId: event.data.object.id,
      });

      return NextResponse.json({
        status: 200,
        message: `Unhandled event type: ${event.type}`,
      });
    }

    const result = await handler(event);

    if (!result.success) {
      console.error({
        message: "Webhook processing failed",
        error: result.error,
        eventId: event.data.object.id,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      status: 200,
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
