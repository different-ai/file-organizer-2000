import { execSync } from "child_process";
import { db, UserUsageTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { setTimeout } from "timers/promises";
import { createYearlySession } from "../app/dashboard/pricing/actions";

// Expected states for different subscription types
type ExpectedState = {
  subscriptionStatus: string;
  paymentStatus: string;
  currentProduct: string;
  currentPlan: string;
  billingCycle: string;
  maxTokenUsage: number;
};

const EXPECTED_STATES = {
  hobby_monthly: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: "subscription",
    currentPlan: "monthly",
    billingCycle: "monthly",
    maxTokenUsage: 5000 * 1000,
  },
  hobby_yearly: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: "subscription",
    currentPlan: "yearly",
    billingCycle: "yearly",
    maxTokenUsage: 5000 * 1000,
  },
  lifetime: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: "lifetime",
    currentPlan: "lifetime",
    billingCycle: "lifetime",
    maxTokenUsage: 0,
  },
  one_year: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: "lifetime",
    currentPlan: "one_year",
    billingCycle: "one_year",
    maxTokenUsage: 0,
  },
  top_up: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: "top_up",
    currentPlan: "top_up",
    billingCycle: "top-up",
    maxTokenUsage: 5000000, // 5M tokens
  },
} as const;

// Helper to generate unique test user IDs
function generateTestUserId(testCase: string): string {
  return `test_${testCase}_${uuidv4().split("-")[0]}`;
}

// Helper to trigger stripe webhook
function triggerWebhook(command: string) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("Error triggering webhook:", error);
    throw error;
  }
}

describe("Stripe Webhook Tests", () => {
  test("Top-up Purchase", async () => {
    // Arrange
    const userId = generateTestUserId("top_up");

    // Act
    triggerWebhook(`stripe trigger payment_intent.succeeded \
      --add payment_intent:metadata.userId=${userId} \
      --add payment_intent:metadata.type=top_up \
      --add payment_intent:metadata.tokens=5000000 \
      --add payment_intent:metadata.price_key=top_up_5m \
      --add payment_intent:metadata.product_key=top_up_5m \
      --add payment_intent:amount=1500 \
      --add payment_intent:currency=usd`);

    // Wait for webhook processing
    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject({
      subscriptionStatus: "active",
      paymentStatus: "succeeded",
      currentProduct: "top_up",
      currentPlan: "top_up",
      billingCycle: "top-up",
      maxTokenUsage: 5000000,
    });
  });

  test("HobbyMonthly Subscription", async () => {
    // Arrange
    const userId = generateTestUserId("hobby_monthly");

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=subscription \
      --add checkout_session:metadata.plan=monthly \
      --add checkout_session:mode=subscription`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_monthly);
  });

  test("Subscription Update", async () => {
    // Arrange
    const userId = generateTestUserId("sub_update");

    // Act - Initial subscription
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=subscription \
      --add checkout_session:metadata.plan=monthly \
      --add checkout_session:mode=subscription`);

    await setTimeout(1000);

    // Assert initial state
    let userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_monthly);

    // Act - Update subscription
    triggerWebhook(`stripe trigger customer.subscription.updated \
      --add subscription:metadata.userId=${userId} \
      --add subscription:metadata.type=subscription \
      --add subscription:metadata.plan=yearly \
      --add subscription:status=active \
      --add subscription:items.data.0.price.recurring.interval=year \
      --add subscription:items.data.0.price.metadata.srm_price_key=yearly`);

    await setTimeout(1000);

    // Assert updated state
    userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_yearly);
  });

  test.only("HobbyYearly Subscription", async () => {
    // Arrange
    const userId = generateTestUserId("hobby_yearly");
    const expectedState = {
      billingCycle: "yearly",
      currentPlan: "yearly",
      currentProduct: "subscription",
      maxTokenUsage: 0,
      paymentStatus: "paid",
      subscriptionStatus: "complete",
    };

    // Act - Checkout Session
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=subscription \
      --add checkout_session:metadata.plan=yearly \
      --add checkout_session:mode=subscription`);

    await setTimeout(2000);

    // Assert checkout session state
    let userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(expectedState);

    // Act - subscription created event
    triggerWebhook(`stripe trigger customer.subscription.created \
      --add subscription:metadata.userId=${userId} \
      --add subscription:metadata.type=subscription \
      --add subscription:metadata.plan=yearly \
      --add subscription:items.data.0.price.recurring.interval=year`);

    await setTimeout(1000);

    // Final assertion
    userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_yearly);
  });

  test("Lifetime Purchase", async () => {
    // Arrange
    const userId = generateTestUserId("lifetime");

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=lifetime \
      --add checkout_session:metadata.plan=lifetime \
      --add checkout_session:mode=payment`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.lifetime);
  });

  test("OneYear Purchase", async () => {
    // Arrange
    const userId = generateTestUserId("one_year");

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=lifetime \
      --add checkout_session:metadata.plan=one_year \
      --add checkout_session:mode=payment`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.one_year);
  });

  test("Invoice Paid", async () => {
    // Arrange
    const userId = generateTestUserId("invoice_paid");

    // Act
    triggerWebhook(`stripe trigger invoice.paid \
      --add invoice:metadata.userId=${userId} \
      --add invoice:metadata.type=subscription \
      --add invoice:metadata.plan=monthly \
      --add invoice:status=paid \
      --add invoice:customer_email=test@example.com`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_monthly);
  });

  test("Failed Payment", async () => {
    // Arrange
    const userId = generateTestUserId("payment_failed");

    // Act
    triggerWebhook(`stripe trigger invoice.payment_failed \
      --add invoice:metadata.userId=${userId} \
      --add invoice:metadata.type=subscription \
      --add invoice:status=payment_failed \
      --add invoice:customer=cus_123`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject({
      subscriptionStatus: "payment_failed",
      paymentStatus: "payment_failed",
      currentProduct: "subscription",
      currentPlan: "none",
      billingCycle: "monthly",
      maxTokenUsage: 5000 * 1000,
    });
  });

  // Add other tests following the same pattern...
});
