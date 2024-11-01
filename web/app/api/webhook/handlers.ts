import { updateClerkMetadata } from '@/lib/services/clerk';
import { db, updateUserSubscriptionData, UserUsageTable } from '@/drizzle/schema';
import { WebhookEvent, CustomerData, WebhookHandlerResponse } from './types';
import { 
  getCheckoutSessionProduct, 
  getCheckoutSessionPrice,
  getSubscriptionProduct,
  getSubscriptionPrice 
} from '@/app/api/webhook/utils';
import { eq } from 'drizzle-orm';

export async function handleCheckoutComplete(event: WebhookEvent): Promise<WebhookHandlerResponse> {
  const session = event.data.object;
  
  const customerData: CustomerData = {
    userId: session.metadata?.userId,
    customerId: session.customer,
    status: session.status,
    paymentStatus: session.payment_status,
    billingCycle: session.mode === 'subscription' ? 'monthly' : 'lifetime',
    product: getCheckoutSessionProduct(session) || 'default',
    plan: getCheckoutSessionPrice(session) || 'default',
    lastPayment: new Date(),
  };

  try {
    await updateUserSubscriptionData(customerData);
    await updateClerkMetadata(customerData);
    // await updateLoopsContact(customerData); // Future implementation

    return {
      success: true,
      message: `Successfully processed checkout for ${customerData.userId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process checkout',
      error,
    };
  }
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

  const customerData: CustomerData = {
    userId,
    customerId: subscription.customer,
    status: 'canceled',
    paymentStatus: 'canceled',
    billingCycle: 'monthly',
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
const resetUserUsage = async (userId: string) => {
  await db.update(UserUsageTable).set({
    tokenUsage: 0,
  }).where(eq(UserUsageTable.userId, userId));
}

export async function handleInvoicePaid(event: WebhookEvent): Promise<WebhookHandlerResponse> {
  const invoice = event.data.object;
  resetUserUsage(invoice.metadata?.userId);
  console.log(invoice);
  return {
    success: true,
    message: 'Invoice paid',
  };
}