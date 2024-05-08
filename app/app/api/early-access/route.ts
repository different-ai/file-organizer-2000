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
  const customer = await findCustomerByEmail(
    user.emailAddresses[0].emailAddress
  );
  console.log("customer", customer);
  const isCustomer =
    (customer !== null &&
      customer.subscriptions.data.some(
        (subscription) => subscription.status === "active"
      )) ||
    // @ts-ignore
    user.publicMetadata?.stripe?.status === "complete";

  console.log("isCustomer", isCustomer, userId);

  return new Response(JSON.stringify({ isCustomer }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
