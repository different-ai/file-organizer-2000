import Stripe from "stripe";

export function getCheckoutSessionProduct(
  session: Stripe.Checkout.Session
): string | null {
  console.log('session', { session });
  const lineItems = session.line_items?.data?.[0];
  // @ts-ignore
  return lineItems?.price?.product?.metadata?.srm_product_key || null;
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
  const productKey = subscription.items?.data?.[0]?.price?.product?.metadata?.srm_product_key;
  console.log('subscription product key', { productKey });
  return productKey || null;
}

export function getSubscriptionPrice(
  subscription: Stripe.Subscription
): string | null {
  // @ts-ignore
  return subscription.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
}
