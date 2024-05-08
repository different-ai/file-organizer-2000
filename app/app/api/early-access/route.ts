import { clerkClient } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});
async function findCustomerByEmail(email: string) {
  console.log("Searching for customer with email:", email);

  const customers = await stripe.customers.search({
    query: `email:"${email}"`,
    expand: ["data.subscriptions"],
  });

  console.log("Customers found:", customers);

  if (customers.data.length === 0) {
    return null;
  }

  return customers.data[0];
}

export async function POST(request: Request) {
  return new Response(JSON.stringify({ isCustomer: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
