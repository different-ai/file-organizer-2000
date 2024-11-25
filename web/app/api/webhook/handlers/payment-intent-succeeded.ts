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

export async function handlePaymentIntentSucceeded(
  event: WebhookEvent
): Promise<WebhookHandlerResponse> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = paymentIntent.metadata?.userId;
  const type = paymentIntent.metadata?.type;
  const tokens = parseInt(paymentIntent.metadata?.tokens || "0");

  if (!userId) {
    return {
      success: false,
      message: "No userId found in payment intent metadata",
    };
  }

  try {
    if (type === "top_up") {
      await handleTopUp(userId, tokens);
      
      if (paymentIntent.customer) {
        try {
          // Get customer email from Stripe
          const customer = await stripe.customers.retrieve(paymentIntent.customer.toString()) as Stripe.Customer;
          
          // Add Loops tracking
          await trackLoopsEvent({
            email: typeof customer === 'string' ? '' : customer.email || '',
            userId,
            eventName: 'top_up_succeeded',
            data: {
                amount: paymentIntent.amount,
                tokens,
              },
          });
        } catch (error) {
          console.error("Error tracking customer event:", error);
        }
      }

      return {
        success: true,
        message: `Successfully processed top-up for ${userId}`,
      };
    }

    // Handle regular subscription payment
    const customerData: CustomerData = {
      userId,
      customerId: paymentIntent.customer?.toString() || "none",
      status: paymentIntent.status,
      billingCycle: "lifetime",
      paymentStatus: paymentIntent.status,
      product: "Lifetime",
      plan: "lifetime",
      lastPayment: new Date(),
    };

    await updateUserSubscriptionData(customerData);
    await resetUserUsageAndSetLastPayment(userId);

    return {
      success: true,
      message: `Successfully processed payment intent for ${userId}`,
    };
  } catch (error) {
    console.error("Payment intent handler error:", error);
    return {
      success: false,
      message: "Failed to process payment intent",
      error,
    };
  }
} 