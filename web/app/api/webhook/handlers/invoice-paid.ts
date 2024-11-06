import { CustomerData, WebhookEvent, WebhookHandlerResponse } from "../types";
import { db, UserUsageTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserSubscriptionData } from "../utils";
import Stripe from "stripe";
import { trackLoopsEvent } from '@/lib/services/loops';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
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

async function getSrmPriceKey(invoice: Stripe.Invoice) {
  return invoice.lines.data[0].price?.metadata?.srm_price_key || "default";
}
async function getStripeProduct(invoice: Stripe.Invoice) {
  const product = await stripe.products.retrieve(
    invoice.lines.data[0].price?.product as string
  );
  return product;
}

async function getSrmProductKey(invoice: Stripe.Invoice) {
  const product = await getStripeProduct(invoice);
  return product.metadata?.srm_product_key || "default";
}

export async function handleInvoicePaid(
  event: WebhookEvent
): Promise<WebhookHandlerResponse> {
  const invoice = event.data.object as Stripe.Invoice;
  const priceKey = await getSrmPriceKey(invoice);
  const productKey = await getSrmProductKey(invoice);
  const userId = invoice.subscription_details?.metadata?.userId;
  const customerData: CustomerData = {
    userId,
    customerId: invoice.customer.toString(),
    status: invoice.status,
    billingCycle: priceKey as "monthly" | "lifetime" | "yearly",
    paymentStatus: invoice.status,
    product: productKey,
    plan: priceKey,
    lastPayment: new Date(),
  };

  try {
    await updateUserSubscriptionData(customerData);
    await resetUserUsageAndSetLastPayment(invoice.metadata?.userId);

    // Add Loops tracking
    await trackLoopsEvent({
      email: invoice.customer_email || '',
      userId: customerData.userId,
      eventName: 'invoice_paid',
      data: {
        amount: invoice.amount_paid,
        product: customerData.product,
        plan: customerData.plan,
      },
    });

    return {
      success: true,
      message: "Invoice paid",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to process invoice",
      error,
    };
  }
}
