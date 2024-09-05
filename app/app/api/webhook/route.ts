import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrUpdateUserSubscriptionStatus, handleFailedPayment } from "@/drizzle/schema";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  console.log("hitting webhook");
  if (req === null)
    throw new Error(`Missing userId or request`, { cause: { req } });
  const stripeSignature = req.headers.get("stripe-signature");
  if (stripeSignature === null) throw new Error("stripeSignature is null");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature,
      webhookSecret
    );
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    if (error instanceof Error)
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
  }
  if (event === undefined) throw new Error(`event is undefined`);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(`Payment successful for session ID: ${session.id}`);
      console.log(`User ID: ${session.metadata?.userId}`);
      console.log(session.status);
      console.log(session.payment_status);
      console.log('session.mode', session.mode);
      try {
        console.log(
          "updating clerk metadata for user",
          session.metadata?.userId
        );
        await clerkClient.users.updateUserMetadata(
          event.data.object.metadata?.userId as string,
          {
            publicMetadata: {
              stripe: {
                // stripe customer id
                customerId: session.customer,
                status: session.status,
                payment: session.payment_status,
              },
            },
          }
        );
      } catch (error) {
        console.error(`Error updating user metadata: ${error}`);
      }

      const billingCycle = session.mode === 'subscription' ? 'monthly' : 'lifetime';

      await createOrUpdateUserSubscriptionStatus(
        session.metadata?.userId,
        session.status,
        session.payment_status,
        billingCycle
      );
      console.log("User subscription status updated");
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await handleFailedPayment(userId, "canceled", "canceled");
        console.log(`Subscription canceled for user ${userId}`);
      } else {
        console.error('Could not find user id');
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const userId = invoice.subscription_details?.metadata?.userId;
      console.log('invoice', invoice);

      if (userId) {
        await handleFailedPayment(userId, "incomplete", "failed");
        console.log(`Payment failed for user ${userId}`);
      } else {
        console.error('Could not find user id');
      }
      break;
    }
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ status: 200, message: "success" });
}
