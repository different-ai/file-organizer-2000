export type WebhookEvent = {
  type: string;
  data: {
    object: any;
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
