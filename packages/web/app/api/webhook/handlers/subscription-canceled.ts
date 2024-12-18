import { createWebhookHandler } from "../handler-factory";
import { WebhookEvent, WebhookHandlerResponse, CustomerData } from "../types";
import { updateClerkMetadata } from "@/lib/services/clerk";
import { db, UserUsageTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserSubscriptionData } from "../utils";
import Stripe from "stripe";

function getSubscriptionProduct(subscription: any): string | null {
  const productKey =
    subscription.items?.data?.[0]?.price?.product?.metadata?.srm_product_key;
  return productKey || null;
}

function getSubscriptionPrice(subscription: any): string | null {
  return subscription.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
}

async function deleteUserSubscriptionData(userId: string) {
  await db
    .update(UserUsageTable)
    .set({
      subscriptionStatus: "canceled",
      paymentStatus: "canceled",
    })
    .where(eq(UserUsageTable.userId, userId));
}

export const handleSubscriptionCanceled = createWebhookHandler(
  async (event: Stripe.CustomerSubscriptionDeletedEvent) => {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;

    await deleteUserSubscriptionData(userId);

    const customerData: CustomerData = {
      userId,
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      status: "canceled",
      paymentStatus: "canceled",
      product: getSubscriptionProduct(subscription) || "none",
      plan: getSubscriptionPrice(subscription) || "none",
      lastPayment: new Date(),
    };

    await updateUserSubscriptionData(customerData);
    await updateClerkMetadata(customerData);

    return {
      success: true,
      message: `Successfully processed cancellation for ${userId}`,
    };
  },
  {
    requiredMetadata: ["userId"],
  }
);
