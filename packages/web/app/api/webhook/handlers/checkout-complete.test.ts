/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { UserUsageTable, db } from "@/drizzle/schema";
import { handleCheckoutComplete } from "./checkout-complete";
import { config } from "@/srm.config";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";

// Mock Loops tracking
jest.mock("@/lib/services/loops", () => ({
  trackLoopsEvent: jest.fn().mockResolvedValue(undefined),
}));

describe("Checkout Complete Handler", () => {
  const mockUserId = "test-user-123";
  const mockEmail = "test@example.com";
  const mockName = "Test User";

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(UserUsageTable).where(eq(UserUsageTable.userId, mockUserId));
  });

  it("should handle monthly subscription checkout", async () => {
    const mockSession = {
      metadata: {
        userId: mockUserId,
        type: config.products.SubscriptionMonthly.metadata.type,
        plan: config.products.SubscriptionMonthly.metadata.plan,
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    const result = await handleCheckoutComplete({
      data: { object: mockSession },
    } as any);

    expect(result).toEqual({
      success: true,
      message: `Successfully processed checkout for ${mockUserId}`,
    });

    // Verify database update
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0]).toMatchObject({
      userId: mockUserId,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      maxTokenUsage: 5000 * 1000, // 5M tokens
      billingCycle: config.products.SubscriptionMonthly.metadata.type,
      currentPlan: config.products.SubscriptionMonthly.metadata.plan,
      hasCatalystAccess: true,
    });
  });

  it("should handle yearly subscription checkout", async () => {
    const mockSession = {
      metadata: {
        userId: mockUserId,
        type: config.products.SubscriptionYearly.metadata.type,
        plan: config.products.SubscriptionYearly.metadata.plan,
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    const result = await handleCheckoutComplete({
      data: { object: mockSession },
    } as any);

    expect(result).toEqual({
      success: true,
      message: `Successfully processed checkout for ${mockUserId}`,
    });

    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0]).toMatchObject({
      userId: mockUserId,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      maxTokenUsage: 5000 * 1000,
      billingCycle: config.products.SubscriptionYearly.metadata.type,
      currentPlan: config.products.SubscriptionYearly.metadata.plan,
      hasCatalystAccess: true,
    });
  });

  it("should handle pay-once checkout", async () => {
    const mockSession = {
      metadata: {
        userId: mockUserId,
        type: config.products.PayOnceOneYear.metadata.type,
        plan: config.products.PayOnceOneYear.metadata.plan,
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    const result = await handleCheckoutComplete({
      data: { object: mockSession },
    } as any);

    expect(result).toEqual({
      success: true,
      message: `Successfully processed checkout for ${mockUserId}`,
    });

    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0]).toMatchObject({
      userId: mockUserId,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      maxTokenUsage: 0,
      billingCycle: config.products.PayOnceOneYear.metadata.type,
      currentPlan: config.products.PayOnceOneYear.metadata.plan,
      hasCatalystAccess: true,
    });
  });

  it("should handle top-up checkout", async () => {
    const topUpTokens = 5000000; // 5M tokens
    const mockSession = {
      metadata: {
        userId: mockUserId,
        type: config.products.PayOnceTopUp.metadata.type,
        plan: config.products.PayOnceTopUp.metadata.plan,
        tokens: topUpTokens.toString(),
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    const result = await handleCheckoutComplete({
      data: { object: mockSession },
    } as any);

    expect(result).toEqual({
      success: true,
      message: `Successfully processed checkout for ${mockUserId}`,
    });

    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0]).toMatchObject({
      userId: mockUserId,
      subscriptionStatus: "active",
      paymentStatus: "succeeded",
      maxTokenUsage: topUpTokens,
      billingCycle: config.products.PayOnceTopUp.metadata.type,
      currentPlan: config.products.PayOnceTopUp.metadata.plan,
      hasCatalystAccess: true,
    });
  });

  it("should handle cumulative top-up tokens", async () => {
    // First top-up
    await db.insert(UserUsageTable).values({
      userId: mockUserId,
      maxTokenUsage: 1000000, // 1M existing tokens
      tokenUsage: 0,
      subscriptionStatus: "active",
      paymentStatus: "succeeded",
      currentProduct: config.products.PayOnceTopUp.metadata.type,
      currentPlan: config.products.PayOnceTopUp.metadata.plan,
      billingCycle: config.products.PayOnceTopUp.metadata.type,
      hasCatalystAccess: true,
    });

    // Second top-up
    const additionalTokens = 5000000; // 5M additional tokens
    const mockSession = {
      metadata: {
        userId: mockUserId,
        type: config.products.PayOnceTopUp.metadata.type,
        plan: config.products.PayOnceTopUp.metadata.plan,
        tokens: additionalTokens.toString(),
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    await handleCheckoutComplete({
      data: { object: mockSession },
    } as any);

    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0].maxTokenUsage).toBe(6000000); // 1M + 5M tokens
  });

  it("should throw error for missing metadata", async () => {
    const mockSession = {
      metadata: {
        // Missing required fields
      },
      customer_details: {
        email: mockEmail,
        name: mockName,
      },
    } as Stripe.Checkout.Session;

    await expect(
      handleCheckoutComplete({
        data: { object: mockSession },
      } as any)
    ).rejects.toThrow("Missing required userId in metadata");
  });
});
