import { WebhookEvent, WebhookHandlerResponse, CustomerData } from '../types';
import { updateClerkMetadata } from '@/lib/services/clerk';
import { updateUserSubscriptionData } from '../utils';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

const getStripeProduct = async (productId: string) => {
  const product = await stripe.products.retrieve(productId);
  return product;
};

async function getSubscriptionProduct(subscription: Stripe.Subscription): Promise<string> {
  const product = await getStripeProduct(subscription.items.data[0]?.price?.product as string);
  return product.metadata?.srm_product_key || 'default';
}

function getSubscriptionPrice(subscription: Stripe.Subscription): string {
  return subscription.items.data[0]?.price?.metadata?.srm_price_key || 'default';
}

function getBillingCycle(subscription: Stripe.Subscription): "monthly" | "yearly" {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
}

export async function handleSubscriptionUpdated(event: WebhookEvent): Promise<WebhookHandlerResponse> {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return {
      success: false,
      message: 'No userId found in subscription metadata',
    };
  }

  const customerData: CustomerData = {
    userId,
    customerId: subscription.customer as string,
    status: subscription.status,
    paymentStatus: subscription.status,
    billingCycle: getBillingCycle(subscription),
    product: await getSubscriptionProduct(subscription),
    plan: getSubscriptionPrice(subscription),
    lastPayment: new Date(),
  };

  try {
    await updateUserSubscriptionData(customerData);
    await updateClerkMetadata(customerData);

    return {
      success: true,
      message: `Successfully processed subscription update for ${userId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process subscription update',
      error,
    };
  }
} 