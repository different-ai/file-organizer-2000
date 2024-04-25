import { clerkClient } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

async function findSubscription(email, priceId) {
  console.log(email, priceId);
  const subscriptions = await stripe.subscriptions.list({
    limit: 1,
    expand: ["data.customer"],
    price: priceId,
  });
  console.log("subscriptions", subscriptions);

  if (subscriptions.data.length === 0) {
    return null;
  }

  const subscription = subscriptions.data[0];
  const customer = subscription.customer;
  console.log("customer", customer);

  // @ts-ignore
  if (customer.email === email) {
    return subscription;
  }

  return null;
}

export async function POST(request: Request) {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return new Response(JSON.stringify({ isCustomer: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the authorization header
  const header = request.headers.get("authorization");
  if (!header) {
    return new Response(JSON.stringify({ isCustomer: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract the API key from the header
  const token = header.replace("Bearer ", "");

  // Verify the API key
  const { result, error } = await verifyKey(token);
  if (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ isCustomer: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the user ID from the API key
  const userId = result.ownerId;

  // Get the user object from Clerk
  const user = await clerkClient.users.getUser(userId);
  const subscription = await findSubscription(
    user.emailAddresses[0].emailAddress,
    process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID as string
  );

  console.log("subscription status", subscription?.status);
  // Check if the user is a customer
  // @ts-ignore
  const isCustomer =
    // @ts-ignore
    user?.publicMetadata?.stripe?.status === "complete" ||
    subscription?.status === "active";
  console.log("isCustomer", isCustomer, userId);

  return new Response(JSON.stringify({ isCustomer }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
