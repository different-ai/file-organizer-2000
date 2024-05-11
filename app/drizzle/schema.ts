import { drizzle } from "drizzle-orm/vercel-postgres";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";
import { sql as psql } from "@vercel/postgres";

// Use this object to send drizzle queries to your DB
export const db = drizzle(psql);
// Create a pgTable that maps to a table in your DB to track user usage
export const UserUsageTable = pgTable(
  "user_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull().unique(),
    apiUsage: integer("apiUsage").notNull(),
    maxUsage: integer("maxUsage").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    billingCycle: text("billingCycle").notNull(),
  },
  (userUsage) => {
    return {
      uniqueUserIdx: uniqueIndex("unique_user_idx").on(userUsage.userId),
    };
  }
);

// createOrUpdateUserUsage will create a new record if one does not exist for the user
// or update the existing record if one does exist
export async function createOrUpdateUserUsage(
  userId: string,
  maxUsage: number,
  billingCycle: string
): Promise<void> {
  const result = await db
    .insert(UserUsageTable)
    .values({
      userId,
      apiUsage: 0,
      maxUsage,
      billingCycle,
    })
    .onConflictDoUpdate({
      target: [UserUsageTable.userId],
      set: {
        maxUsage,
        billingCycle,
      },
    });
  console.log("User Usage Results for User ID:", userId);
  // Record created or updated, exit the retry loop
}

export async function incrementApiUsage(userId: string): Promise<void> {
  console.log("Incrementing API Usage for User ID:", userId);
  // get current apiUsage

  try {
    await db
      .update(UserUsageTable)
      .set({
        apiUsage: sql`${UserUsageTable.apiUsage} + 1`,
      })
      .where(eq(UserUsageTable.userId, userId));

    console.log("Incremented API Usage for User ID:", userId);
  } catch (error) {
    console.error("Error incrementing API Usage for User ID:", userId);
    console.error(error);
  }

  // Increment successful, exit the retry loop
}
export const checkApiUsage = async (userId: string) => {
  console.log("Checking API Usage for User ID:", userId);
  try {
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId))
      .limit(1)
      .execute();

    console.log("User Usage Results for User ID:", userId, userUsage);
    if (userUsage.length === 0) {
      console.log("No usage record found for User ID:", userId);
      await createOrUpdateUserUsage(userId, 10000, "monthly");
    }
    if (userUsage[0].apiUsage >= userUsage[0].maxUsage) {
      console.log("User has exceeded their API usage limit");

      return {
        remaining: 0,
        usageError: false,
      };
    }
    console.log("User has not exceeded their API usage limit");
    return {
      remaining: userUsage[0].maxUsage - userUsage[0].apiUsage,
      usageError: false,
    };
  } catch (error) {
    console.error("Error checking API Usage for User ID:", userId);
    console.error(error);
    return {
      remaining: 0,
      usageError: true,
    };
  }
};
