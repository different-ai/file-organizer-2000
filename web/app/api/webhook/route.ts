import { NextRequest, NextResponse } from "next/server";
import {
  handleCheckoutComplete,
  handleSubscriptionCanceled,
} from "@/lib/webhook/handlers";
import { verifyStripeWebhook } from "@/lib/webhook/verify";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature and get event
    const event = await verifyStripeWebhook(req);

    // Handle different event types
    let result;
    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutComplete(event);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionCanceled(event);
        break;
      // Add more handlers as needed
      default:
        return NextResponse.json({
          status: 200,
          message: `Unhandled event type: ${event.type}`,
        });
    }

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
