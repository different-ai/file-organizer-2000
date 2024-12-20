import { UserUsageTable, db } from "@/drizzle/schema";
import { createWebhookHandler } from "../handler-factory";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";
import { config, ProductMetadata } from "@/srm.config";
import { sql } from "drizzle-orm";

// sample yearly metadata
// "metadata": {
// "plan":
// "yearly",
// "type":
// "subscription",
// "userId":
// "user_2fxYYN5l4R3BkYc2UW4yuMTHj2G",
// },

const handleSubscription = async (
  session: Stripe.Checkout.Session & { metadata: ProductMetadata }
) => {
  const metadata = session.metadata;
  console.log("creating subscription with metadata", metadata);

  // insert or update
  await db
    .insert(UserUsageTable)
    .values({
      userId: metadata.userId,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      maxTokenUsage: 5000 * 1000,
      billingCycle: metadata.type,
      lastPayment: new Date(),
      currentPlan: metadata.plan,
      currentProduct: metadata.type,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        lastPayment: new Date(),
        currentPlan: metadata.plan,
        currentProduct: metadata.type,
      },
    });
};

const handlePayOnce = async (
  session: Stripe.Checkout.Session & { metadata: ProductMetadata }
) => {
  const metadata = session.metadata;
  console.log("creating pay once with metadata", metadata);
  await db.insert(UserUsageTable).values({
    userId: metadata.userId,
    subscriptionStatus: "active",
    paymentStatus: "paid",
    maxTokenUsage: 0,
    billingCycle: metadata.type,
    lastPayment: new Date(),
      currentPlan: metadata.plan,
      currentProduct: metadata.type,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        lastPayment: new Date(),
      },
    });
};
async function handleTopUp(userId: string, tokens: number) {
  console.log("Handling top-up for user", userId, "with", tokens, "tokens");

  await db
    .insert(UserUsageTable)
    .values({
      userId,
      maxTokenUsage: tokens,
      tokenUsage: 0,
      subscriptionStatus: "active",
      paymentStatus: "succeeded",
      currentProduct: config.products.PayOnceTopUp.metadata.type,
      currentPlan: config.products.PayOnceTopUp.metadata.plan,
      billingCycle: config.products.PayOnceTopUp.metadata.type,
      lastPayment: new Date(),
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        maxTokenUsage: sql`COALESCE(${UserUsageTable.maxTokenUsage}, 0) + ${tokens}`,
        lastPayment: new Date(),
        subscriptionStatus: "active",
        paymentStatus: "succeeded",
      },
    });
}

export const handleCheckoutComplete = createWebhookHandler(async (event) => {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log("checkout complete", session);

  // Validate required metadata
  if (!session.metadata?.userId) {
    throw new Error("Missing required userId in metadata");
  }
  if (!session.metadata?.type) {
    throw new Error("Missing required type in metadata");
  }
  if (!session.metadata?.plan) {
    throw new Error("Missing required plan in metadata");
  }

  // either yearly or monthly subscription
  if (
    session.metadata?.plan ===
      config.products.SubscriptionYearly.metadata.plan ||
    session.metadata?.plan === config.products.SubscriptionMonthly.metadata.plan
  ) {
    await handleSubscription(
      session as Stripe.Checkout.Session & { metadata: ProductMetadata }
    );
  }
  // either pay once year or pay once lifetime
  if (
    session.metadata?.plan === config.products.PayOnceOneYear.metadata.plan ||
    session.metadata?.plan === config.products.PayOnceLifetime.metadata.plan
  ) {
    await handlePayOnce(
      session as Stripe.Checkout.Session & { metadata: ProductMetadata }
    );
  }
  // pay once top up
  if (session.metadata?.plan === config.products.PayOnceTopUp.metadata.plan) {
    console.log("handling top-up", session.metadata);
    if (!session.metadata.tokens) {
      throw new Error("Missing required tokens in metadata");
    }
    await handleTopUp(
      session.metadata.userId,
      parseInt(session.metadata.tokens)
    );
  }

  if (session.customer_details?.email) {
    await trackLoopsEvent({
      email: session.customer_details.email,
      firstName: session.customer_details?.name?.split(" ")[0],
      lastName: session.customer_details?.name?.split(" ").slice(1).join(" "),
      userId: session.metadata?.userId,
      eventName: "checkout_completed",
      data: {
        type: session.metadata?.type,
        plan: session.metadata?.plan,
      },
    });
  }

  return {
    success: true,
    message: `Successfully processed checkout for ${session.metadata?.userId}`,
  };
});
