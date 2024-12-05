import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, UserUsageTable } from "@/drizzle/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { updateClerkMetadata } from "@/lib/services/clerk";
import { trackLoopsEvent } from "@/lib/services/loops";
import { validateWebhookMetadata } from "@/srm.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

type WebhookHandlerResponse = {
  success: boolean;
  message: string;
  error?: Error;
};

type BillingCycle = "monthly" | "yearly" | "lifetime";

// Utility function to verify Stripe webhook signature
async function verifyStripeWebhook(req: NextRequest): Promise<Stripe.Event> {
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
    );

    console.log(`✅ Verified webhook event: ${event.type}`);
    return event;
  } catch (error) {
    console.error("⚠️ Webhook verification failed:", error);
    throw new Error(`Webhook verification failed: ${error.message}`);
  }
}

// Handle top-up payments
async function handleTopUp(userId: string, tokens: number) {
  console.log("Handling top-up for user", userId, "with", tokens, "tokens");

  await db
    .insert(UserUsageTable)
    .values({
      userId,
      maxTokenUsage: tokens,
      tokenUsage: 0,
      subscriptionStatus: 'active',
      paymentStatus: 'succeeded',
      currentProduct: 'top_up',
      currentPlan: 'top_up',
      billingCycle: 'top-up',
      lastPayment: new Date(),
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        maxTokenUsage: sql`COALESCE(${UserUsageTable.maxTokenUsage}, 0) + ${tokens}`,
        lastPayment: new Date(),
        subscriptionStatus: 'active',
        paymentStatus: 'succeeded',
      },
    });
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  const billingCycle: BillingCycle = interval === 'year' ? 'yearly' : 'monthly';

  const customerData = {
    userId,
    customerId: subscription.customer as string,
    status: subscription.status,
    paymentStatus: subscription.status,
    billingCycle,
    product: subscription.items.data[0]?.price?.product?.toString() || 'default',
    plan: subscription.items.data[0]?.price?.metadata?.srm_price_key || 'default',
    lastPayment: new Date(),
  };

  await updateClerkMetadata(customerData);
}

// Handle subscription cancellations
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await db
    .update(UserUsageTable)
    .set({
      subscriptionStatus: "canceled",
      paymentStatus: "canceled",
    })
    .where(eq(UserUsageTable.userId, userId));

  const customerData = {
    userId,
    customerId: subscription.customer as string,
    status: "canceled",
    paymentStatus: "canceled",
    product: "none",
    plan: "none",
    billingCycle: "monthly" as BillingCycle,
    lastPayment: new Date(),
  };

  await updateClerkMetadata(customerData);
}

// Handle successful payments
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  const type = paymentIntent.metadata?.type;
  const tokens = parseInt(paymentIntent.metadata?.tokens || "0");

  if (!userId) return;

  if (type === "top_up" && tokens > 0) {
    await handleTopUp(userId, tokens);
  }

  // Track the payment event
  const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
  if (customer && !('deleted' in customer)) {
    await trackLoopsEvent({
      email: customer.email || '',
      userId,
      eventName: 'payment_succeeded',
      data: {
        amount: paymentIntent.amount,
        type,
        tokens: tokens || undefined,
      },
    });
  }
}

// Main webhook handler
const handlers: Record<string, (event: Stripe.Event) => Promise<WebhookHandlerResponse>> = {
  'checkout.session.completed': async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    
    if (!validateWebhookMetadata(metadata)) {
      throw new Error('Invalid metadata in checkout session');
    }

    return {
      success: true,
      message: `Checkout completed for user ${metadata.userId}`,
    };
  },

  'payment_intent.succeeded': async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handleSuccessfulPayment(paymentIntent);
    return {
      success: true,
      message: `Payment processed for user ${paymentIntent.metadata?.userId}`,
    };
  },

  'customer.subscription.updated': async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionUpdate(subscription);
    return {
      success: true,
      message: `Subscription updated for user ${subscription.metadata?.userId}`,
    };
  },

  'customer.subscription.deleted': async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionCancellation(subscription);
    return {
      success: true,
      message: `Subscription cancelled for user ${subscription.metadata?.userId}`,
    };
  },

  'invoice.paid': async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = invoice.metadata?.userId;

    if (userId) {
      await db
        .update(UserUsageTable)
        .set({
          tokenUsage: 0,
          maxTokenUsage: 5000 * 1000,
          lastPayment: new Date(),
        })
        .where(eq(UserUsageTable.userId, userId));
    }

    return {
      success: true,
      message: `Invoice paid for user ${userId}`,
    };
  },

  'invoice.payment_failed': async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = invoice.metadata?.userId;

    if (userId) {
      await updateClerkMetadata({
        userId,
        customerId: invoice.customer?.toString() || "",
        status: "payment_failed",
        paymentStatus: invoice.status,
        product: "subscription",
        plan: "none",
        billingCycle: "monthly" as BillingCycle,
        lastPayment: new Date(),
      });
    }

    return {
      success: true,
      message: `Payment failed for user ${userId}`,
    };
  },
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const event = await verifyStripeWebhook(req);
    const handler = handlers[event.type];

    if (!handler) {
      console.log(`Unhandled webhook event type: ${event.type}`);
      return NextResponse.json(
        { message: `Unhandled event type: ${event.type}` },
        { status: 200 }
      );
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

    console.log({
      message: `Webhook ${event.type} processed successfully`,
      eventId: event.id,
      duration: Date.now() - startTime,
    });

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
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
} 