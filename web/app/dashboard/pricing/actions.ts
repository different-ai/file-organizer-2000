"use server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { PRODUCTS, PRICES } from "../../../srm.config";

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
  const metadata = {
    userId,
    type: PRODUCTS.Lifetime.metadata.type,
  };

  const { success, cancel, lifetime } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    metadata,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: PRODUCTS.Lifetime.name,
            metadata: PRODUCTS.Lifetime.metadata,
          },
          unit_amount: PRICES.LIFETIME,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata,
    },
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
  const metadata = {
    userId,
    type: PRODUCTS.HobbyMonthly.metadata.type,
    plan: PRODUCTS.HobbyMonthly.metadata.plan,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    metadata,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: PRODUCTS.HobbyMonthly.name,
            metadata: PRODUCTS.HobbyMonthly.metadata,
          },
          unit_amount: PRICES.MONTHLY,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata,
    },
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
      type: PRODUCTS.HobbyYearly.metadata.type,
      plan: PRODUCTS.HobbyYearly.metadata.plan,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: PRODUCTS.HobbyYearly.name,
            metadata: PRODUCTS.HobbyYearly.metadata,
          },
          unit_amount: PRICES.YEARLY,
          recurring: {
            interval: "year",
          },
        },
        quantity: 1,
      },
    ],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: PRODUCTS.HobbyYearly.prices.yearly.trialPeriodDays,
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
      type: PRODUCTS.OneYear.metadata.type,
      plan: PRODUCTS.OneYear.metadata.plan,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: PRODUCTS.OneYear.name,
            metadata: PRODUCTS.OneYear.metadata,
          },
          unit_amount: PRICES.ONE_YEAR,
        },
        quantity: 1,
      },
    ],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}
