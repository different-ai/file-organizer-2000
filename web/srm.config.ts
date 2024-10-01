import { PreSRMConfig } from "@u22n/srm";

const features = {
  support: "Support",
  freeTrial: "3-day Free trial",
  noExternalAI: "No external AI subscription needed",
  easySetup: "Seamless no-sweat setup",
  fileLimit: "~1000 files per month",
  audioTranscription: "120 min audio transcription p/m",
  moneyBackGuarantee: "30 days money-back guarantee",
  premiumSupport: "Premium support",
  privacy: "Privacy-focused",
  guidedSetup: "Quick guided setup",
  payAsYouGo: "Pay-as-you-go with your own OpenAI key",
};


// Simplified environment-based target URL configuration
const getTargetUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return process.env.VERCEL_BRANCH_URL;
  }

  return "localhost:3000";
};

const targetUrl = getTargetUrl();
const webhookEndpoint = `https://${targetUrl}/api/webhook`;


export const config = {
  features: features,
  products: {
    Hobby: {
      name: "Subscription Plan",
      id: "subscription",
      prices: {
        monthly: {
          // $15
          amount: 1500, // Adjust this to match your current price
          interval: "month",
          type: "recurring",
        },
        yearly: {
          // $150
          amount: 15000, // Adjust this to match your current price
          interval: "year",
          type: "recurring",
        },
      },
      features: [
        features.support,
        features.freeTrial,
        features.noExternalAI,
        features.easySetup,
        features.fileLimit,
        features.audioTranscription,
        features.moneyBackGuarantee,
      ],
    },
    Lifetime: {
      name: "Lifetime Payment",
      id: "lifetime",
      prices: {
        lifetime: {
          // $250
          amount: 25000, // Adjust this to match your current price
          interval: "one_time",
          type: "one_time",
        },
      },
      features: [
        features.support,
        features.privacy,
        features.premiumSupport,
        features.audioTranscription,
        features.moneyBackGuarantee,
        features.guidedSetup,
        features.payAsYouGo,
      ],
    },
  },
  webhooks: {
    endpoint: webhookEndpoint,
    events: [
      "checkout.session.completed",
      "customer.subscription.deleted",
      "invoice.payment_failed",
    ],
  },
} satisfies PreSRMConfig;
