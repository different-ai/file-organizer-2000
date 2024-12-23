import { NextRequest } from "next/server";
import Stripe from "stripe";
import { WebhookEvent } from "./types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function verifyStripeWebhook(req: NextRequest): Promise<WebhookEvent> {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    ) as WebhookEvent;

    console.log(`✅ Verified webhook event: ${event.type}`);
    return event;
  } catch (error) {
    console.error("⚠️ Webhook verification failed:", error);
    throw new Error(`Webhook verification failed: ${error.message}`);
  }
} 