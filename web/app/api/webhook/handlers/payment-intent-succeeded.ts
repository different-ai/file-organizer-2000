import { createWebhookHandler } from '../handler-factory';
import { CustomerData, WebhookEvent, WebhookHandlerResponse } from "../types";
import { db, UserUsageTable } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { updateUserSubscriptionData } from "../utils";
import Stripe from "stripe";
import { trackLoopsEvent } from '@/lib/services/loops';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

async function resetUserUsageAndSetLastPayment(userId: string) {
  await db
    .update(UserUsageTable)
    .set({
      tokenUsage: 0,
      lastPayment: new Date(),
    })
    .where(eq(UserUsageTable.userId, userId));
}

async function handleTopUp(userId: string, tokens: number) {
  console.log("Handling top-up for user", userId, "with", tokens, "tokens");

  await db
    .update(UserUsageTable)
    .set({
      maxTokenUsage: sql`${UserUsageTable.maxTokenUsage} + ${tokens}`,
      lastPayment: new Date(),
      subscriptionStatus: 'active',
      paymentStatus: 'succeeded',
      currentProduct: 'top_up',
      currentPlan: 'top_up',
    })
    .where(eq(UserUsageTable.userId, userId));
}

async function trackCustomerEvent(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.customer) {
    try {
      const customer = await stripe.customers.retrieve(
        paymentIntent.customer.toString()
      ) as Stripe.Customer;
      
      await trackLoopsEvent({
        email: typeof customer === 'string' ? '' : customer.email || '',
        userId: paymentIntent.metadata?.userId,
        eventName: 'top_up_succeeded',
        data: {
          amount: paymentIntent.amount,
          tokens: parseInt(paymentIntent.metadata?.tokens || "0"),
        },
      });
    } catch (error) {
      console.error("Error tracking customer event:", error);
    }
  }
}

function createCustomerData(paymentIntent: Stripe.PaymentIntent): CustomerData {
  return {
    userId: paymentIntent.metadata?.userId,
    customerId: paymentIntent.customer?.toString() || "none",
    status: paymentIntent.status,
    billingCycle: "lifetime",
    paymentStatus: paymentIntent.status,
    product: "Lifetime",
    plan: "lifetime",
    lastPayment: new Date(),
  };
}

export const handlePaymentIntentSucceeded = createWebhookHandler(
  async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.userId;
    const type = paymentIntent.metadata?.type;
    const tokens = parseInt(paymentIntent.metadata?.tokens || "0");

    if (type === "top_up") {
      await handleTopUp(userId, tokens);
      await trackCustomerEvent(paymentIntent);
      return {
        success: true,
        message: `Successfully processed top-up for ${userId}`,
      };
    }

    // Handle regular subscription payment
    const customerData = createCustomerData(paymentIntent);
    await updateUserSubscriptionData(customerData);

    return {
      success: true,
      message: `Successfully processed payment intent for ${userId}`,
    };
  },
  {
    requiredMetadata: ['userId'],
  }
); 