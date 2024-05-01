import Stripe from "stripe";
import { findCustomerByEmail } from "../early-access/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

async function generatePaymentUpdateLink(email: string) {
  try {
    // Retrieve the first active subscription for the customer with the given email
    const subscriptions = await stripe.subscriptions.search({
      limit: 1,
      expand: ["data.customer"],
      query: `customer.email="${email}"`,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    console.log("Subscription found:", subscription.id);
    console.log("Subscription:", subscription);

    // Generate a unique payment update link for the subscription
    const paymentUpdateLink = `https://your-website.com/update-payment?subscription=${subscription.id}`;

    return paymentUpdateLink;
  } catch (error) {
    console.error("Error generating payment update link:", error);
    throw error;
  }
}
const findFirstActiveSubscription = async (
    customer: Stripe.Customer
  ) => {
    return customer.subscriptions.data.find(
      (subscription) => subscription.status === "active"
    );
  };

// Example usage in a Next.js route handler
export async function GET(request: Request) {
  const userEmail = "ben@embedbase.xyz"; // Assuming you have access to the user's email

  try {
    const customer = await findCustomerByEmail(userEmail);
    if (!customer) {
      throw new Error("Customer not found");
    }
    const subscription = await findFirstActiveSubscription(customer);

    console.log("Subscription:", subscription);

    // const paymentUpdateLink = await generatePaymentUpdateLink(userEmail);
    // return new Response(paymentUpdateLink);
  } catch (error) {
    return new Response("Error generating payment update link", {
      status: 500,
    });
  }
}
