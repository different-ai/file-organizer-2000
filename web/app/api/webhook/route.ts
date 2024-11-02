import { NextRequest, NextResponse } from "next/server";
import { handleCheckoutComplete } from "./handlers/checkout-complete";
import { handleSubscriptionCanceled } from "./handlers/subscription-canceled";
import { handleInvoicePaid } from "./handlers/invoice-paid";
import { handlePaymentIntentSucceeded } from "./handlers/payment-intent-succeeded";
import { verifyStripeWebhook } from "./verify";
import { handleSubscriptionUpdated } from "./handlers/subscription-updated";

const HANDLERS = {
  "checkout.session.completed": handleCheckoutComplete,
  "customer.subscription.deleted": handleSubscriptionCanceled,
  "invoice.paid": handleInvoicePaid,
  "payment_intent.succeeded": handlePaymentIntentSucceeded,
  "customer.subscription.updated": handleSubscriptionUpdated,
} as const;

export async function POST(req: NextRequest) {
  try {
    const event = await verifyStripeWebhook(req);
    const handler = HANDLERS[event.type as keyof typeof HANDLERS];

    if (!handler) {
      return NextResponse.json({
        status: 200,
        message: `Unhandled event type: ${event.type}`,
      });
    }

    const result = await handler(event);

    if (!result.success) {
      console.error(result.error);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ status: 200, message: result.message });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
