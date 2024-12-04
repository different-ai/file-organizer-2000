import { PreSRMConfig, SubscriptionWebhookEvent } from "./lib/srm/src";
import Stripe from "stripe";

// Product and plan types for type safety
export type ProductType = "subscription" | "lifetime" | "top_up";
export type PlanType = "monthly" | "yearly" | "lifetime" | "top_up";

// Pricing configuration
export const PRICES = {
  MONTHLY: 1500, // $15.00
  YEARLY: 11900, // $119.00
  LIFETIME: 30000, // $300.00
  ONE_YEAR: 20000, // $200.00
} as const;

const cloudFeatures = [
  "AI-Powered File Organization",
  "~1000 files per month",
  "300 min audio transcription p/m",
  "Premium support",
];

const standardPayOnceFeatures = [
  "Premium Support",
  "Quick-guided setup",
  "Requires your own OpenAI key",
  "Pay-as-you-go",
  "30-day money-back guarantee",
];

// Product metadata configuration
export const PRODUCTS = {
  HobbyMonthly: {
    name: "File Organizer 2000 - Cloud",
    type: "subscription" as ProductType,
    metadata: {
      type: "subscription",
      plan: "monthly" as PlanType,
    },
    prices: {
      monthly: {
        amount: PRICES.MONTHLY,
        interval: "month" as const,
        type: "recurring" as const,
      },
    },
    features: cloudFeatures,
  },
  HobbyYearly: {
    name: "File Organizer 2000 - Cloud",
    type: "subscription" as ProductType,
    metadata: {
      type: "subscription",
      plan: "yearly" as PlanType,
    },
    prices: {
      yearly: {
        amount: PRICES.YEARLY,
        interval: "year" as const,
        type: "recurring" as const,
        trialPeriodDays: 7,
      },
    },
    features: [...cloudFeatures, "Save 33% compared to monthly"],
  },
  Lifetime: {
    name: "File Organizer 2000 - Pay Once",
    type: "lifetime" as ProductType,
    metadata: {
      type: "lifetime",
      plan: "lifetime" as PlanType,
    },
    prices: {
      lifetime: {
        amount: PRICES.LIFETIME,
        type: "one_time" as const,
        interval: "one_time" as const,
      },
    },
    features: [...standardPayOnceFeatures, "Multiple License Forever"],
  },
  OneYear: {
    name: "File Organizer 2000 - Pay Once",
    type: "lifetime" as ProductType,
    metadata: {
      type: "lifetime",
      plan: "one_year" as PlanType,
    },
    prices: {
      one_year: {
        amount: PRICES.ONE_YEAR,
        type: "one_time" as const,
        interval: "one_time" as const,
      },
    },
    features: [...standardPayOnceFeatures, "One Year of Updates"],
  },
} as const;

// Helper to get URLs based on environment
export const getTargetUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL;
  }
  if (process.env.VERCEL_ENV === "preview") {
    return process.env.VERCEL_PROJECT_PREVIEW_URL;
  }
  return "localhost:3000";
};

// Stripe session creator helper
export const createStripeSession = async (
  stripe: Stripe,
  {
    userId,
    productKey,
    successUrl,
    cancelUrl,
  }: {
    userId: string;
    productKey: keyof typeof PRODUCTS;
    successUrl: string;
    cancelUrl: string;
  }
) => {
  const product = PRODUCTS[productKey];
  const priceKey = Object.keys(product.prices)[0];
  const price = product.prices[priceKey];

  const isSubscription = price.type === "recurring";

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    payment_method_types: ["card"],
    metadata: {
      userId,
      ...product.metadata,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            metadata: product.metadata,
          },
          unit_amount: price.amount,
          ...(isSubscription && {
            recurring: {
              interval: price.interval,
            },
          }),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    ...(isSubscription &&
      price.trialPeriodDays && {
        subscription_data: {
          trial_period_days: price.trialPeriodDays,
        },
      }),
  });

  return session;
};

// Webhook configuration
export const webhookConfig = {
  events: [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.updated",
    "invoice.paid",
    "invoice.payment_failed",
    "payment_intent.succeeded",
  ] as SubscriptionWebhookEvent[],
  endpoint: `https://${getTargetUrl()}/api/webhook`,
};

// Helper to validate webhook metadata
export const validateWebhookMetadata = (metadata: any) => {
  if (!metadata?.userId) {
    console.warn("Missing userId in webhook metadata");
    return false;
  }
  if (!metadata?.type) {
    console.warn("Missing type in webhook metadata");
    return false;
  }
  return true;
};

// Export the full config
export const config = {
  products: PRODUCTS,
  webhooks: webhookConfig,
} satisfies PreSRMConfig;

// Type helpers for webhook handlers
export type WebhookMetadata = {
  userId: string;
  type: ProductType;
  plan: PlanType;
};

export type WebhookEventType = SubscriptionWebhookEvent;
