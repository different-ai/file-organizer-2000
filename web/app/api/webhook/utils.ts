import Stripe from "stripe";
/**
 * Retrieves the SRM product key from a Stripe webhook event
 */
export function getProductKey(event: Stripe.Event): string | null {
  const object = event.data.object as any;

  // Handle different event types
  if (event.type.startsWith("checkout.session")) {
    const lineItems = object.line_items?.data?.[0];
    return lineItems?.price?.product?.metadata?.srm_product_key || null;
  }

  if (event.type.startsWith("subscription")) {
    return (
      object.items?.data?.[0]?.price?.product?.metadata?.srm_product_key || null
    );
  }

  // For other events that have product metadata
  return (
    object.product?.metadata?.srm_product_key ||
    object.metadata?.srm_product_key ||
    null
  );
}

/**
 * Retrieves the SRM price key from a Stripe webhook event
 */
export function getPriceKey(event: Stripe.Event): string | null {
  const object = event.data.object as any;

  // Handle different event types
  if (event.type.startsWith("checkout.session")) {
    const lineItems = object.line_items?.data?.[0];
    return lineItems?.price?.metadata?.srm_price_key || null;
  }

  if (event.type.startsWith("subscription")) {
    return object.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
  }

  // For other events that have price metadata
  return (
    object.price?.metadata?.srm_price_key ||
    object.metadata?.srm_price_key ||
    null
  );
}
