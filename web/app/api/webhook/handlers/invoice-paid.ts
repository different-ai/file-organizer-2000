import { createWebhookHandler } from "../handler-factory";
import { CustomerData } from "../types";
import { db, UserUsageTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserSubscriptionData } from "../utils";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function resetUserUsageAndSetLastPayment(userId: string) {
  console.log("resetUserUsageAndSetLastPayment", userId);
  await db
    .update(UserUsageTable)
    .set({
      tokenUsage: 0,
      maxTokenUsage: 5000 * 1000,
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

function createCustomerDataFromInvoice(
  invoice: Stripe.Invoice,
  priceKey: string,
  productKey: string
): CustomerData {
  return {
    userId:
      invoice.subscription_details?.metadata?.userId ||
      invoice.metadata?.userId,
    customerId: invoice.customer.toString(),
    status: invoice.status,
    billingCycle: priceKey as "monthly" | "lifetime" | "yearly",
    paymentStatus: invoice.status,
    product: productKey,
    plan: priceKey,
    lastPayment: new Date(),
  };
}

async function updateUserSubscriptionDataFromInvoice(invoice: Stripe.Invoice) {
  const priceKey = await getSrmPriceKey(invoice);
  const productKey = await getSrmProductKey(invoice);
  const customerData = createCustomerDataFromInvoice(
    invoice,
    priceKey,
    productKey
  );

  await db
    .insert(UserUsageTable)
    .values({
      userId: customerData.userId,
      subscriptionStatus: customerData.status,
      paymentStatus: customerData.paymentStatus,
      billingCycle: customerData.billingCycle,
      maxTokenUsage: 5000 * 1000,
      lastPayment: new Date(),
      currentProduct: customerData.product,
      currentPlan: customerData.plan,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        subscriptionStatus: invoice.status,
        paymentStatus: invoice.status,
        billingCycle: priceKey as "monthly" | "lifetime" | "yearly",
        lastPayment: new Date(),
        currentProduct: productKey,
        currentPlan: priceKey,
      },
    });
}

export const handleInvoicePaid = createWebhookHandler(
  async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log("invoice paid", invoice);
    if (!invoice.subscription_details) {
      return {
        success: false,
        message: "No subscription details found",
      };
    }

  await db
  .insert(UserUsageTable)
    .values({
      userId: invoice.subscription_details.metadata?.userId,
      subscriptionStatus: invoice.status,
      paymentStatus: invoice.status,
      billingCycle: invoice.subscription_details.metadata?.type as "monthly" | "yearly" | "lifetime", 
      maxTokenUsage: 5000 * 1000,
      lastPayment: new Date(),
      currentProduct: productKey,
      currentPlan: priceKey,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
      subscriptionStatus: invoice.status,
      paymentStatus: invoice.status,
      billingCycle: priceKey as "monthly" | "lifetime" | "yearly",
      lastPayment: new Date(),
      currentProduct: productKey,
      currentPlan: priceKey,
    },
  });
}
    

    await resetUserUsageAndSetLastPayment(invoice.metadata?.userId);

    await trackLoopsEvent({
      email: invoice.customer_email || "",
      userId: invoice.metadata?.userId,
      eventName: "invoice_paid",
      data: {
        amount: invoice.amount_paid,
        product:
          invoice.lines.data[0].price?.metadata?.srm_product_key || "default",
        plan: invoice.lines.data[0].price?.metadata?.srm_price_key || "default",
      },
    });

    return {
      success: true,
      message: "Invoice paid",
    };
  },
  {
    requiredMetadata: [],
  }
);
