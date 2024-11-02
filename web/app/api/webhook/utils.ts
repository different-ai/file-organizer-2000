import { db, UserUsageTable } from "@/drizzle/schema";
import { CustomerData } from "./types";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});


export async function updateUserSubscriptionData(
  data: CustomerData
): Promise<void> {
  await db
    .insert(UserUsageTable)
    .values({
      userId: data.userId,
      subscriptionStatus: data.status,
      paymentStatus: data.paymentStatus,
      billingCycle: data.billingCycle,
      lastPayment: new Date(),
      currentProduct: data.product,
      currentPlan: data.plan,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        subscriptionStatus: data.status,
        paymentStatus: data.paymentStatus,
        billingCycle: data.billingCycle,
        lastPayment: new Date(),
        currentProduct: data.product,
        currentPlan: data.plan,
      },
    });
}
