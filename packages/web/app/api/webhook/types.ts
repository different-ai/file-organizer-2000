import Stripe from "stripe";

export type WebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Stripe.Event.Data.Object & {
      id: string;
      metadata?: {
        userId?: string;
        type?: string;
        plan?: string;
      };
    };
  };
};

export type WebhookHandlerResponse = {
  success: boolean;
  message: string;
  error?: Error;
};

export type CustomerData = {
  userId: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  billingCycle?: "monthly" | "lifetime" | "yearly";
  product: string;
  plan: string;
  lastPayment: Date;
  createdAt?: Date;
};
