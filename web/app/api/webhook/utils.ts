import Stripe from "stripe";

export function getCheckoutSessionProduct(
  session: Stripe.Checkout.Session
): string | null {
  const lineItems = session.line_items?.data?.[0];
  return lineItems?.price?.product?.metadata?.srm_product_key || null;
}

export function getCheckoutSessionPrice(
  session: Stripe.Checkout.Session
): string | null {
  const lineItems = session.line_items?.data?.[0];
  return lineItems?.price?.metadata?.srm_price_key || null;
}

export function getSubscriptionProduct(
  subscription: Stripe.Subscription
): string | null {
  const productKey = subscription.items?.data?.[0]?.price?.product?.metadata?.srm_product_key;
  console.log('subscription product key', { productKey });
  return productKey || null;
}

export function getSubscriptionPrice(
  subscription: Stripe.Subscription
): string | null {
  return subscription.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
}
