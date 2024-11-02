import { WebhookEvent, WebhookHandlerResponse, CustomerData } from '../types';
import { updateClerkMetadata } from '@/lib/services/clerk';
import { db,  UserUsageTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { updateUserSubscriptionData } from '../utils';

function getSubscriptionProduct(subscription: any): string | null {
  const productKey = subscription.items?.data?.[0]?.price?.product?.metadata?.srm_product_key;
  return productKey || null;
}

function getSubscriptionPrice(subscription: any): string | null {
  return subscription.items?.data?.[0]?.price?.metadata?.srm_price_key || null;
}

async function deleteUserSubscriptionData(userId: string) {
  await db.update(UserUsageTable).set({
    subscriptionStatus: 'canceled',
    paymentStatus: 'canceled',
  }).where(eq(UserUsageTable.userId, userId));
}

export async function handleSubscriptionCanceled(event: WebhookEvent): Promise<WebhookHandlerResponse> {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    return {
      success: false,
      message: 'No userId found in subscription metadata',
    };
  }

  await deleteUserSubscriptionData(userId);

  const customerData: CustomerData = {
    userId,
    customerId: subscription.customer,
    status: 'canceled',
    paymentStatus: 'canceled',
    product: getSubscriptionProduct(subscription) || 'none',
    plan: getSubscriptionPrice(subscription) || 'none',
    lastPayment: new Date(),
  };

  try {
    await updateUserSubscriptionData(customerData);
    await updateClerkMetadata(customerData);
    return {
      success: true,
      message: `Successfully processed cancellation for ${userId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process cancellation',
      error,
    };
  }
} 