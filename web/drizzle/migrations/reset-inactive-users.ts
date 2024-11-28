import { db, UserUsageTable } from "../schema";
import { eq, sql } from "drizzle-orm";

export async function resetInactiveUsers() {
  try {
    // 1. Reset token usage for inactive users
    await db
      .update(UserUsageTable)
      .set({
        maxTokenUsage: 0,
        tokenUsage: 0
      })
      .where(eq(UserUsageTable.subscriptionStatus, 'inactive'));

    console.log("Successfully reset token usage for inactive users");

    // 2. Get count of affected users for logging
    const inactiveUsers = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(UserUsageTable)
      .where(eq(UserUsageTable.subscriptionStatus, 'inactive'));

    console.log(`Reset ${inactiveUsers[0].count} inactive users`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
} 