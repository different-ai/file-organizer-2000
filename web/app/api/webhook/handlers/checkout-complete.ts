import { UserUsageTable, db } from "@/drizzle/schema";
import { createWebhookHandler } from "../handler-factory";
import { CustomerData } from "../types";
import { trackLoopsEvent } from "@/lib/services/loops";
import Stripe from "stripe";
// import db schema 
const createUser = async(customerData: CustomerData) => {
  await db.insert(UserUsageTable).values({
    userId: customerData.userId,
    subscriptionStatus: customerData.status,
    paymentStatus: customerData.paymentStatus,
    billingCycle: customerData.billingCycle,
    lastPayment: customerData.lastPayment,
    currentProduct: customerData.product,
    currentPlan: customerData.plan,
  });
}

function createCustomerDataFromSession(
  session: Stripe.Checkout.Session
): CustomerData {
  console.log('create customer data from session');
  console.log("session", session,);
  const { type = "subscription", plan = "monthly" } = session.metadata || {};
  
  const customerData: CustomerData = {
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
  // this should now be added to the database
  return customerData;
}


export const handleCheckoutComplete = createWebhookHandler(
  async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("checkout complete", session);
    
    // Validate required metadata
    if (!session.metadata?.userId) {
      throw new Error("Missing required userId in metadata");
    }

    const customerData = createCustomerDataFromSession(session);
    await createUser(customerData);
    // await updateClerkMetadata(customerData);
    
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
