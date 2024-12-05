import { UserUsageTable, db } from "@/drizzle/schema";
import { createWebhookHandler } from "../handler-factory";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";
import { ProductMetadata } from "@/srm.config";


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

  await db.insert(UserUsageTable).values({
    userId: metadata.userId,
    subscriptionStatus: "active",
    paymentStatus: "paid",
    maxTokenUsage: 5000 * 1000,
    billingCycle: metadata.type,
    lastPayment: new Date(),
    currentPlan: metadata.plan,
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
  });
};

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

  if (session.metadata?.type === "subscription") {
    await handleSubscription(
      session as Stripe.Checkout.Session & { metadata: ProductMetadata }
    );
  }
  if (session.metadata?.type === "pay-once") {
    await handlePayOnce(
      session as Stripe.Checkout.Session & { metadata: ProductMetadata }
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
