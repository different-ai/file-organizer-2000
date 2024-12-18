import { db, UserUsageTable } from "../schema";
import { eq, or, sql } from "drizzle-orm";

export async function resetInactiveUsers() {
  try {
    // 1. Reset token usage for inactive users or users with a lifetime billing cycle
    await db
      .update(UserUsageTable)
      .set({
        maxTokenUsage: 0,
        tokenUsage: 0
      })
      .where(
        or(
          eq(UserUsageTable.subscriptionStatus, 'inactive'),
          eq(UserUsageTable.billingCycle, 'lifetime')
        )
      );

    console.log("Successfully reset token usage for inactive users and users with a lifetime billing cycle");

    // 2. Get count of affected users for logging
    const affectedUsers = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(UserUsageTable)
      .where(
        or(
          eq(UserUsageTable.subscriptionStatus, 'inactive'),
          eq(UserUsageTable.billingCycle, 'lifetime')
        )
      );

    console.log(`Reset ${affectedUsers[0].count} users`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
} 