import { PreSRMConfig } from "@u22n/srm/dist";

const features = {
  support: "Support",
  freeTrial: "7-day Free trial",
  noExternalAI: "No external AI subscription needed",
  easySetup: "Seamless no-sweat setup",
  fileLimit: "~1000 files per month",
  audioTranscription: "300 min audio transcription p/m",
  moneyBackGuarantee: "30 days money-back guarantee",
  premiumSupport: "Premium support",
  privacy: "Privacy-focused",
  guidedSetup: "Quick guided setup",
  payAsYouGo: "Pay-as-you-go with your own OpenAI key",
  earlyAccess: "Early access to new features",
  onboardingCall: "Onboarding call with a founder",
};

// Simplified environment-based target URL configuration
export const getTargetUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "file-organizer-2000-git-billing-test-prologe.vercel.app";
  }

  return "localhost:3000";
};

const targetUrl = getTargetUrl();
const webhookEndpoint = `https://${targetUrl}/api/webhook`;

export const config = {
  features: features,
  products: {
    HobbyMonthly: {
      name: "Hobby Monthly Plan",
      id: "subscription_monthly",
      prices: {
        monthly: {
          // $15
          amount: 1500, // Adjust this to match your current price
          interval: "month",
          type: "recurring",
        },
      },
      features: [
        features.noExternalAI,
        features.easySetup,
        features.fileLimit,
        features.audioTranscription,
        features.support,
        features.moneyBackGuarantee,
      ],
    },
    HobbyYearly: {
      name: "Hobby Yearly Plan",
      id: "subscription_yearly",
      prices: {
        yearly: {
          // $99
          amount: 9900, // Adjust this to match your current price
          interval: "year",
          type: "recurring",
          trialPeriodDays: 7, // Add trial period for annual plan
        },
      },
      features: [
        features.freeTrial,
        features.noExternalAI,
        features.easySetup,
        features.fileLimit,
        features.audioTranscription,
        features.earlyAccess,
        features.premiumSupport,
        features.moneyBackGuarantee,
      ],
    },
    Lifetime: {
      name: "Lifetime Payment",
      id: "lifetime",
      prices: {
        lifetime: {
          // $199
          amount: 19900, // Adjust this to match your current price
          interval: "one_time",
          type: "one_time",
        },
      },
      features: [
        features.privacy,
        features.payAsYouGo,
        features.guidedSetup,
        features.audioTranscription,
        features.onboardingCall,
        features.premiumSupport,
        features.moneyBackGuarantee,
      ],
    },
  },
  webhooks: {
    endpoint: webhookEndpoint,
    events: [
      "customer.subscription.created",
      "customer.subscription.deleted",
      "checkout.session.completed",
      "invoice.payment_failed",
      "invoice.paid",
      "payment_intent.succeeded",
    ],
  },
} satisfies PreSRMConfig;
