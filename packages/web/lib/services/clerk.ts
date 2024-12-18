import { clerkClient } from "@clerk/nextjs/server";
import { CustomerData } from '../../app/api/webhook/types';

export async function updateClerkMetadata(data: CustomerData) {
  try {
    await clerkClient().users.updateUserMetadata(data.userId, {
      publicMetadata: {
        stripe: {
          customerId: data.customerId,
          status: data.status,
          payment: data.paymentStatus,
          product: data.product,
          plan: data.plan,
          billingCycle: data.billingCycle,
          lastPayment: data.lastPayment,
        },
      },
    });

    console.log(`Updated Clerk metadata for user ${data.userId}`);
  } catch (error) {
    console.error('Error updating Clerk metadata:', error);
    throw error; // Re-throw to be handled by the webhook handler
  }
} 