import { createWebhookHandler } from "../handler-factory";
import { CustomerData } from "../types";
import { updateClerkMetadata } from "@/lib/services/clerk";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";

function createCustomerDataFromSession(
  session: Stripe.Checkout.Session
): CustomerData {
  console.log('create customer data from session');
  console.log("session", session,);
  const { type = "subscription", plan = "monthly" } = session.metadata || {};
  
  return {
    userId: session.metadata?.userId,
    customerId: session.customer?.toString(),
    status: session.status,
    paymentStatus: session.payment_status,
    billingCycle: type === "lifetime" ? "lifetime" : plan as "monthly" | "yearly",
    product: type,
    plan: plan,
    lastPayment: new Date(),
    createdAt: new Date(session.created * 1000),
  };
}

export const handleCheckoutComplete = createWebhookHandler(
  async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Validate required metadata
    if (!session.metadata?.userId) {
      throw new Error("Missing required userId in metadata");
    }

    const customerData = createCustomerDataFromSession(session);
    await updateClerkMetadata(customerData);
    
    if (session.customer_details?.email) {
      await trackLoopsEvent({
        email: session.customer_details.email,
        firstName: session.customer_details?.name?.split(" ")[0],
        lastName: session.customer_details?.name?.split(" ").slice(1).join(" "),
        userId: customerData.userId,
        eventName: "checkout_completed",
        data: {
          type: session.metadata?.type,
          plan: session.metadata?.plan,
        }
      });
    }

    return {
      success: true,
      message: `Successfully processed checkout for ${customerData.userId}`,
    };
  }
);
