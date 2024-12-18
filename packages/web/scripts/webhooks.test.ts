import { execSync } from "child_process";
import { db, UserUsageTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { setTimeout } from "timers/promises";
import { config } from "../srm.config";


const EXPECTED_STATES = {
  hobby_monthly: {
    subscriptionStatus: "active",
    paymentStatus: "paid",
    currentProduct: config.products.SubscriptionMonthly.metadata.type,
    currentPlan: config.products.SubscriptionMonthly.metadata.plan,
    billingCycle: config.products.SubscriptionMonthly.metadata.type,
    maxTokenUsage: 5000 * 1000,
  },
  hobby_yearly: {
    subscriptionStatus: "active",
    paymentStatus: "paid",
    currentProduct: config.products.SubscriptionYearly.metadata.type,
    currentPlan: config.products.SubscriptionYearly.metadata.plan,
    billingCycle: config.products.SubscriptionYearly.metadata.type,
    maxTokenUsage: 5000 * 1000,
  },
  lifetime: {
    subscriptionStatus: "active",
    paymentStatus: "paid",
    currentProduct: config.products.PayOnceLifetime.metadata.type,
    currentPlan: config.products.PayOnceLifetime.metadata.plan,
    billingCycle: config.products.PayOnceLifetime.metadata.type,
    maxTokenUsage: 0,
  },
  one_year: {
    subscriptionStatus: "active",
    paymentStatus: "paid",
    currentProduct: config.products.PayOnceOneYear.metadata.type,
    currentPlan: config.products.PayOnceOneYear.metadata.plan,
    billingCycle: config.products.PayOnceOneYear.metadata.type,
    maxTokenUsage: 0,
  },
  top_up: {
    subscriptionStatus: "active",
    paymentStatus: "succeeded",
    currentProduct: config.products.PayOnceTopUp.metadata.type,
    currentPlan: config.products.PayOnceTopUp.metadata.plan,
    billingCycle: config.products.PayOnceTopUp.metadata.type,
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

    const type = config.products.PayOnceTopUp.metadata.type;
    const plan = config.products.PayOnceTopUp.metadata.plan;

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${type} \
      --add checkout_session:metadata.plan=${plan} \
      --add checkout_session:metadata.tokens=5000000`);

    // Wait for webhook processing
    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.top_up);
  });

  test("HobbyMonthly Subscription", async () => {
    // Arrange
    const userId = generateTestUserId("hobby_monthly");
    const type = config.products.SubscriptionMonthly.metadata.type;
    const plan = config.products.SubscriptionMonthly.metadata.plan;

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${type} \
      --add checkout_session:metadata.plan=${plan} \
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

  test("HobbyYearly Subscription", async () => {
    // Arrange
    const userId = generateTestUserId("hobby_yearly");
    const type = config.products.SubscriptionYearly.metadata.type;
    const plan = config.products.SubscriptionYearly.metadata.plan;

    // Act - Checkout Session
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${type} \
      --add checkout_session:metadata.plan=${plan} \
      --add checkout_session:mode=subscription`);

    await setTimeout(2000);

    // Assert checkout session state
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject(EXPECTED_STATES.hobby_yearly);
  });

  test("Lifetime Purchase", async () => {
    // Arrange
    const userId = generateTestUserId("lifetime");
    const type = config.products.PayOnceLifetime.metadata.type;
    const plan = config.products.PayOnceLifetime.metadata.plan;

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${type} \
      --add checkout_session:metadata.plan=${plan} \
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
    const type = config.products.PayOnceOneYear.metadata.type;
    const plan = config.products.PayOnceOneYear.metadata.plan;

    // Act
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${type} \
      --add checkout_session:metadata.plan=${plan} \
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

  test("Failed Payment", async () => {
    // Arrange
    const userId = generateTestUserId("payment_failed");
    const metadata = {
      userId,
      type: config.products.SubscriptionMonthly.metadata.type,
      plan: config.products.SubscriptionMonthly.metadata.plan,
    };
    // complete a session first
    triggerWebhook(`stripe trigger checkout.session.completed \
      --add checkout_session:metadata.userId=${userId} \
      --add checkout_session:metadata.type=${metadata.type} \
      --add checkout_session:metadata.plan=${metadata.plan} \
      --add checkout_session:mode=subscription`);

    // Act
    triggerWebhook(`stripe trigger invoice.payment_failed \
      --add invoice:metadata.userId=${userId} \
      --add invoice:customer=cus_123`);

    await setTimeout(1000);

    // Assert
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId));

    expect(userUsage).toHaveLength(1);
    expect(userUsage[0]).toMatchObject({
      paymentStatus: "payment_failed",
      maxTokenUsage: 0,
    });
  });
});
