import { db, UserUsageTable } from "@/drizzle/schema";
import { PRODUCTS } from "@/srm.config";
import { eq } from "drizzle-orm";
import type { Server } from "http";
import { createServer } from "http";
import { NextApiHandler } from "next";
import { GET } from "./route";
import type { SuperTest, Test } from "supertest";
import supertest from "supertest";
/**
 * @jest-environment node
 */

describe("Token Reset Cron Job", () => {
  const mockUserId = "test-user-123";
  const monthlyTokenLimit = 5000 * 1000; // 5M tokens
  let server: Server;
  let request: SuperTest<Test>;

  beforeAll(() => {
    const handler: NextApiHandler = (req, res) => {
      if (req.method === "GET") {
        return GET(req as any);
      }
    };
    server = createServer(handler as any);
    request = supertest(server);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    // Setup test data
    await db.insert(UserUsageTable).values({
      userId: mockUserId,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      tokenUsage: 1000000, // 1M tokens used
      maxTokenUsage: monthlyTokenLimit,
      billingCycle: "subscription",
      currentPlan: PRODUCTS.SubscriptionMonthly.metadata.plan,
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(UserUsageTable).where(eq(UserUsageTable.userId, mockUserId));
  });

  it("should reset token usage for active subscribers", async () => {
    const response = await request
      .get("/api/cron/reset-tokens")
      .set("authorization", `Bearer ${process.env.CRON_SECRET}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Token usage reset successful",
    });

    // Verify token usage was reset
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0].tokenUsage).toBe(0);
    expect(userUsage[0].maxTokenUsage).toBe(monthlyTokenLimit);
  });

  it("should not reset tokens for inactive subscriptions", async () => {
    // Update user to inactive
    await db
      .update(UserUsageTable)
      .set({ subscriptionStatus: "inactive" })
      .where(eq(UserUsageTable.userId, mockUserId));

    const response = await request
      .get("/api/cron/reset-tokens")
      .set("authorization", `Bearer ${process.env.CRON_SECRET}`);

    expect(response.status).toBe(200);

    // Verify token usage was not reset
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, mockUserId));

    expect(userUsage[0].tokenUsage).toBe(1000000); // Should remain unchanged
  });

  it("should return 401 for unauthorized requests", async () => {
    const response = await request
      .get("/api/cron/reset-tokens")
      .set("authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    // Mock a database error
    jest.spyOn(db, "update").mockRejectedValueOnce(
      new Error("Database error") as never
    );

    const response = await request
      .get("/api/cron/reset-tokens")
      .set("authorization", `Bearer ${process.env.CRON_SECRET}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: "Failed to reset token usage",
    });
  });
}); 