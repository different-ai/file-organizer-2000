"use server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Helper to get URLs
const getUrls = () => {
  const headersList = headers();
  const origin = headersList.get("origin") || "";
  return {
    success: `${origin}/dashboard/subscribers`,
    cancel: `${origin}/dashboard`,
    lifetime: `${origin}/dashboard/lifetime`,
  };
};

export async function createOneTimePaymentCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");
  
  const { success, cancel, lifetime } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    metadata: {
      userId,
      type: "lifetime",
    },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Lifetime License",
          metadata: {
            type: "lifetime",
          },
        },
        unit_amount: 19900, // $199.00
      },
      quantity: 1,
    }],
    success_url: lifetime,
    cancel_url: cancel,
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}

export async function createSubscriptionCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");

  const { success, cancel } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    metadata: {
      userId,
      type: "subscription",
      plan: "monthly",
    },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Monthly Subscription",
          metadata: {
            type: "subscription",
            plan: "monthly",
          },
        },
        unit_amount: 1500, // $15.00
        recurring: {
          interval: "month",
        },
      },
      quantity: 1,
    }],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}

export async function createYearlySubscriptionCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");

  const { success, cancel } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription", 
    payment_method_types: ["card"],
    metadata: {
      userId,
      type: "subscription",
      plan: "yearly",
    },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Yearly Subscription",
          metadata: {
            type: "subscription",
            plan: "yearly",
          },
        },
        unit_amount: 9900, // $99.00
        recurring: {
          interval: "year",
        },
      },
      quantity: 1,
    }],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
    },
  });

  redirect(session.url!);
}

export async function createOneYearCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");
  
  const { success, cancel } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    metadata: {
      userId,
      type: "lifetime",
      plan: "one_year",
    },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "One Year License",
          metadata: {
            type: "lifetime",
            plan: "one_year",
          },
        },
        unit_amount: 20000, // $200.00
      },
      quantity: 1,
    }],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}