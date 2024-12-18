import { createWebhookHandler } from '../handler-factory';
import { CustomerData } from '../types';
import { updateClerkMetadata } from '@/lib/services/clerk';
import { updateUserSubscriptionData } from '../utils';
import Stripe from 'stripe';
import { trackLoopsEvent } from '@/lib/services/loops';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
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

export const handleSubscriptionUpdated = createWebhookHandler(
  async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

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

    await updateUserSubscriptionData(customerData);
    await updateClerkMetadata(customerData);

    const customer = await stripe.customers.retrieve(
      subscription.customer as string
    ) as Stripe.Customer;
    
    await trackLoopsEvent({
      email: typeof customer === 'string' ? '' : customer.email || '',
      userId: customerData.userId,
      eventName: 'subscription_updated',
      data: {
        product: customerData.product,
        plan: customerData.plan,
        billingCycle: customerData.billingCycle,
        status: subscription.status,
      },
    });

    return {
      success: true,
      message: `Successfully processed subscription update for ${userId}`,
    };
  },
  {
    requiredMetadata: ['userId'],
  }
); 