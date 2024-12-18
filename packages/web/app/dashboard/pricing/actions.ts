"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { PRODUCTS, PRICES } from "../../../srm.config";
import { getUrl } from "@/lib/getUrl";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Helper to get URLs
const getUrls = () => {
  const origin = getUrl();
  return {
    success: `${origin}/dashboard/subscribers`,
    cancel: `${origin}/dashboard`,
    lifetime: `${origin}/dashboard/lifetime`,
  };
};

export async function createPayOnceLifetimeCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");
  const metadata = {
    userId,
    type: "pay-once",
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
            name: PRODUCTS.PayOnceLifetime.name,
            metadata: PRODUCTS.PayOnceLifetime.metadata,
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

export async function createMonthlySubscriptionCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");

  const { success, cancel } = getUrls();
  const metadata = {
    userId,
    type: PRODUCTS.SubscriptionMonthly.metadata.type,
    plan: PRODUCTS.SubscriptionMonthly.metadata.plan,
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
            name: PRODUCTS.SubscriptionMonthly.name,
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

export async function createYearlySession(userId: string) {
  const { success, cancel } = getUrls();
  const metadata = {
    userId,
    type: PRODUCTS.SubscriptionYearly.metadata.type,
    plan: PRODUCTS.SubscriptionYearly.metadata.plan,
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
            name: PRODUCTS.SubscriptionYearly.name,
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
      trial_period_days:
        PRODUCTS.SubscriptionYearly.prices.yearly.trialPeriodDays,
      metadata,
    },
  });
  return session;
}

export async function createYearlySubscriptionCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");
  const session = await createYearlySession(userId);
  redirect(session.url!);
}

export async function createPayOnceOneYearCheckout() {
  const { userId } = auth();
  if (!userId) throw new Error("Not authenticated");

  const { success, cancel } = getUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    metadata: {
      userId,
      type: PRODUCTS.PayOnceOneYear.metadata.type,
      plan: PRODUCTS.PayOnceOneYear.metadata.plan,
      product: PRODUCTS.PayOnceOneYear.name,
    },

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: PRODUCTS.PayOnceOneYear.name,
            metadata: PRODUCTS.PayOnceOneYear.metadata,
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
