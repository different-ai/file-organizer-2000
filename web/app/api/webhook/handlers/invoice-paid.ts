import { createWebhookHandler } from '../handler-factory';
import { CustomerData } from '../types';
import { db, UserUsageTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { updateUserSubscriptionData } from '../utils';
import { trackLoopsEvent } from '@/lib/services/loops';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
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
    userId: invoice.subscription_details?.metadata?.userId,
    customerId: invoice.customer.toString(),
    status: invoice.status,
    billingCycle: priceKey as "monthly" | "lifetime" | "yearly",
    paymentStatus: invoice.status,
    product: productKey,
    plan: priceKey,
    lastPayment: new Date(),
  };
}

export const handleInvoicePaid = createWebhookHandler(
  async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const priceKey = await getSrmPriceKey(invoice);
    const productKey = await getSrmProductKey(invoice);
    
    const customerData = createCustomerDataFromInvoice(invoice, priceKey, productKey);
    
    await updateUserSubscriptionData(customerData);
    await resetUserUsageAndSetLastPayment(invoice.metadata?.userId);

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
  },
  {
    requiredMetadata: [],
  }
);
