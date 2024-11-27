import { createWebhookHandler } from "../handler-factory";
import { CustomerData } from "../types";
import { updateClerkMetadata } from "@/lib/services/clerk";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";
import { updateAnonymousUserEmail } from "../../anon";

function createCustomerDataFromSession(
  session: Stripe.Checkout.Session
): CustomerData {
  return {
    userId: session.metadata?.userId,
    customerId: session.customer?.toString(),
    status: session.status,
    paymentStatus: session.payment_status,
    billingCycle: session.mode === "subscription" ? "monthly" : "lifetime",
    product: session.metadata?.product_key || "default",
    plan: session.metadata?.price_key || "default",
    lastPayment: new Date(),
    createdAt: new Date(session.created * 1000),
  };
}

// focused on updating non-critical data like sending emails and tracking events
// most of the decisions are made either in payment intent , invoice-paid, subscription-updated.
export const handleCheckoutComplete = createWebhookHandler(
  async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerData = createCustomerDataFromSession(session);
    // if it's a top up we check if the user is anonymous and update their email
    if (session.metadata?.product_key === "top_up_5m") {
      const wasAnonymous = await updateAnonymousUserEmail(
        session.metadata?.userId || "",
        session.customer_details?.email || ""
      );
      if (wasAnonymous) {
        console.log(
          `Updated email for user ${session.metadata?.userId} to ${session.customer_details?.email}`
        );
      }
    }

    await updateClerkMetadata(customerData);
    await trackLoopsEvent({
      email: session.customer_details?.email || "",
      firstName: session.customer_details?.name?.split(" ")[0],
      lastName: session.customer_details?.name?.split(" ").slice(1).join(" "),
      userId: customerData.userId,
      eventName: "checkout_completed",
    });

    return {
      success: true,
      message: `Successfully processed checkout for ${customerData.userId}`,
    };
  },
  {
    requiredMetadata: ["userId", "product_key", "price_key"],
  }
);
