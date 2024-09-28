import { PreSRMConfig } from "@u22n/srm";

export const config = {
  features: {
    support: "Support",
    freeTrial: "3-day Free trial",
    noExternalAI: "No external AI subscription needed",
    easySetup: "Seamless no-sweat setup",
    fileLimit: "~1000 files per month",
    audioTranscription: "120 min audio transcription p/m",
    moneyBackGuarantee: "30 days money-back guarantee",
    premiumSupport: "Premium support",
    privacy: "Privacy-focused",
  },
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
      },
      features: [
        "support",
        "freeTrial",
        "noExternalAI",
        "easySetup",
        "fileLimit",
        "audioTranscription",
        "moneyBackGuarantee",
      ],
    },
    lifetime: {
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
        "support",
        "privacy",
        "premiumSupport",
        "audioTranscription",
        "moneyBackGuarantee",
      ],
    },
  },
} satisfies PreSRMConfig
