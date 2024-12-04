import { TaxCode } from "./tax-codes";

export interface PreSRMConfig {
  readonly features?: Record<string, string>;
  readonly products: Record<string, SRMProduct>;
  readonly webhooks?: {
    readonly endpoint: string;
    readonly events: SubscriptionWebhookEvent[];
  };
}

export type SubscriptionWebhookEvent =
  | "checkout.session.completed"
  | "customer.created"
  | "customer.subscription.created"
  | "customer.subscription.deleted"
  | "customer.subscription.paused"
  | "customer.subscription.resumed"
  | "customer.subscription.trial_will_end"
  | "customer.subscription.updated"
  | "entitlements.active_entitlement_summary.updated"
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.finalization_failed"
  | "invoice.paid"
  | "invoice.payment_action_required"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "invoice.updated"
  | "payment_intent.created"
  | "payment_intent.succeeded"
  | "subscription_schedule.aborted"
  | "subscription_schedule.canceled"
  | "subscription_schedule.completed"
  | "subscription_schedule.created"
  | "subscription_schedule.expiring"
  | "subscription_schedule.released"
  | "subscription_schedule.updated";

export interface SRMProduct {
  readonly name: string;
  readonly prices: Record<string, SRMPrice>;
  readonly features: readonly string[];
  readonly taxCode?: TaxCode;
}

export interface SRMPriceBase {
  readonly amount: number;
  readonly interval: "day" | "week" | "month" | "year" | "one_time";
  readonly type: "recurring" | "one_time";
  readonly trialPeriodDays?: number;
}

export interface RecurringSRMPrice extends SRMPriceBase {
  readonly type: "recurring";
}

export interface OneTimeSRMPrice extends SRMPriceBase {
  readonly type: "one_time";
}


export type SRMPrice = RecurringSRMPrice | OneTimeSRMPrice;

export interface CheckoutUrlParams {
  userId: string;
  successUrl: string;
  cancelUrl: string;
  allowPromotionCodes?: boolean;
}
