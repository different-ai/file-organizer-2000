import { updateClerkMetadata } from '@/lib/services/clerk';
import { updateUserSubscriptionData } from '@/drizzle/schema';
import { WebhookEvent, CustomerData, WebhookHandlerResponse } from './types';
import { 
  getCheckoutSessionProduct, 
  getCheckoutSessionPrice,
  getSubscriptionProduct,
  getSubscriptionPrice 
} from '@/app/api/webhook/utils';

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