import { CustomerData, WebhookEvent, WebhookHandlerResponse } from "../types";
import { db, UserUsageTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserSubscriptionData } from "../utils";
import Stripe from "stripe";
import { trackLoopsEvent } from '@/lib/services/loops';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
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

export async function handlePaymentIntentSucceeded(
  event: WebhookEvent
): Promise<WebhookHandlerResponse> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = paymentIntent.metadata?.userId;

  if (!userId) {
    return {
      success: false,
      message: "No userId found in payment intent metadata",
    };
  }

  const customerData: CustomerData = {
    userId,
    customerId: paymentIntent.customer?.toString() || "none",
    status: paymentIntent.status,
    billingCycle: "lifetime", // Payment intents are typically for one-time payments
    paymentStatus: paymentIntent.status,
    // this is the name of the product
    // should be a key of srm.products
    product: "Lifetime",
    // use key of srm.products.Lifetime
    plan: "lifetime",

    lastPayment: new Date(),
  };

  try {
    await updateUserSubscriptionData(customerData);
    await resetUserUsageAndSetLastPayment(userId);


    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(paymentIntent.customer.toString()) as Stripe.Customer;

    // Add Loops tracking
    await trackLoopsEvent({
      email: typeof customer === 'string' ? '' : customer?.email || '',
      userId: customerData.userId,
      eventName: 'payment_succeeded',
      data: {
        amount: paymentIntent.amount,
        product: customerData.product,
        plan: customerData.plan,
      },
    });

    return {
      success: true,
      message: `Successfully processed payment intent for ${userId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to process payment intent",
      error,
    };
  }
} 