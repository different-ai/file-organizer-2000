// import { db, UserUsageTable } from "@/drizzle/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, UserUsageTable } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

async function syncUsers() {
  console.log("Starting user sync");

  // Get all users from Clerk
  const clerkUsers = await clerkClient.users.getUserList();

  for (const user of clerkUsers.data) {
    const userId = user.id;
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.log(`No email found for user ${userId}, skipping`);
      continue;
    }

    // Check if user exists in our database
    const dbUser = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId))
      .limit(1);

    if (dbUser.length === 0) {
      // User doesn't exist in our database, create them
      await db.insert(UserUsageTable).values({
        userId,
        apiUsage: 0,
        maxUsage: 2000, // Set default values
        billingCycle: "monthly",
        tokenUsage: 0,
        subscriptionStatus: "inactive",
        paymentStatus: "unpaid",
      });
      console.log(`Created new user record for ${userId}`);
    }

    // Check Stripe subscription status
    const stripeCustomer = await stripe.customers.search({
      query: `email:'${email}'`,
      expand: ["data.subscriptions"],
    });

    if (stripeCustomer.data.length > 0) {
      const customer = stripeCustomer.data[0];
      const subscription = customer.subscriptions?.data[0];

      if (subscription) {
        const subscriptionStatus = subscription.status;
        const latestInvoiceId = subscription.latest_invoice?.toString();
        if (!latestInvoiceId) {
          console.log("No latest invoice found for user", userId);
          return;
        }
        // Get latest invoice payment intent from the invoice id
        const invoice = await stripe.invoices.retrieve(latestInvoiceId);
        // get payment intent from the payment intent id
        const paymentIntentId = invoice.payment_intent?.toString();
        if (!paymentIntentId) {
          console.log("No payment intent found for user", userId);
          return;
        }
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );
        if (!paymentIntent) {
          console.log("No payment intent found for user", userId);
          return;
        }
        console.log(paymentIntent);
        const paymentStatus =
          paymentIntent.status === "succeeded" ? "paid" : "unpaid";

        // Update user in our database
        await db
          .update(UserUsageTable)
          .set({
            subscriptionStatus,
            paymentStatus,
          })
          .where(eq(UserUsageTable.userId, userId));

        console.log(
          `Updated subscription status for ${userId}: ${subscriptionStatus}, ${paymentStatus}`
        );
      }
    }
  }

  console.log("User sync completed");
}

// Run the sync
syncUsers().catch(console.error);
