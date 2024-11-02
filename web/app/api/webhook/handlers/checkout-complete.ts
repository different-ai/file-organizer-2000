import { WebhookEvent, WebhookHandlerResponse, CustomerData } from '../types';
import { updateClerkMetadata } from '@/lib/services/clerk';
import { updateUserSubscriptionData } from '../utils';


export async function handleCheckoutComplete(event: WebhookEvent): Promise<WebhookHandlerResponse> {
  const session = event.data.object;

  const customerData: CustomerData = {
    userId: session.metadata?.userId,
    customerId: session.customer,
    status: session.status,
    paymentStatus: session.payment_status,
    billingCycle: session.mode === 'subscription' ? 'monthly' : 'lifetime',
    product: session.metadata?.product_key || 'default',
    plan: session.metadata?.price_key || 'default',
    lastPayment: new Date(),
    createdAt: new Date(session.created * 1000),
  };

  try {
    await updateClerkMetadata(customerData);

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