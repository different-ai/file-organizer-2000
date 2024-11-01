import { db, UserUsageTable } from "@/drizzle/schema";
import { CustomerData } from "./types";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const getStripeProduct = async (product: Stripe.Product) => {
  // fetch stripe product with metadata
  const stripeProduct = await stripe.products.retrieve(product.id);
  return stripeProduct.metadata?.srm_product_key || null;
};

export async function getCheckoutSessionProduct(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  console.log("session", { session });
  const lineItems = session.line_items?.data?.[0];
  const product = await getStripeProduct(
    lineItems?.price?.product as Stripe.Product
  );
  return product || null;
}

export function getCheckoutSessionPrice(
  session: Stripe.Checkout.Session
): string | null {
  const lineItems = session.line_items?.data?.[0];
  // @ts-ignore
  return lineItems?.price?.metadata?.srm_price_key || null;
}

export function getSubscriptionProduct(
  subscription: Stripe.Subscription
): string | null {
  // @ts-ignore
  const productKey =
    subscription.items?.data?.[0]?.price?.product?.metadata?.srm_product_key;
  console.log("subscription product key", { productKey });
  return productKey || null;
}

export function getSubscriptionPrice(
  subscription: Stripe.Subscription
): string | null {
  // @ts-ignore
  return subscription.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
}

export async function updateUserSubscriptionData(
  data: CustomerData
): Promise<void> {
  await db
    .insert(UserUsageTable)
    .values({
      userId: data.userId,
      subscriptionStatus: data.status,
      paymentStatus: data.paymentStatus,
      billingCycle: data.billingCycle,
      lastPayment: new Date(),
      currentProduct: data.product,
      currentPlan: data.plan,
      apiUsage: 0,
      maxUsage: 0,
      tokenUsage: 0,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        subscriptionStatus: data.status,
        paymentStatus: data.paymentStatus,
        billingCycle: data.billingCycle,
        lastPayment: new Date(),
        currentProduct: data.product,
        currentPlan: data.plan,
      },
    });
}
