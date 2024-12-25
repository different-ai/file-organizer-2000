'use server';

import { db, UserUsageTable, createEmptyUserUsage } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from 'next/cache';
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export async function claimTokens() {
  try {
    // Check if after deadline
    const deadline = new Date('2025-01-01');
    if (new Date() > deadline) {
      return { error: "This offer has expired" };
    }

    // Get authenticated user
    const headersList = headers();
    const request = new NextRequest('https://dummy.url', {
      headers: headersList,
    });
    
    const { userId } = await handleAuthorizationV2(request);
    if (!userId) {
      return { error: "You must be logged in to claim tokens" };
    }

    // Get or create user usage record
    let [usage] = await db.select().from(UserUsageTable).where(eq(UserUsageTable.userId, userId));

    if (!usage) {
      await createEmptyUserUsage(userId);
      [usage] = await db.select().from(UserUsageTable).where(eq(UserUsageTable.userId, userId));
    }

    // Check if already claimed
    if (usage.maxTokenUsage >= 5_000_000) {
      return { error: "You have already claimed this offer" };
    }

    // Increase maxTokenUsage by 5M
    const result = await db
      .update(UserUsageTable)
      .set({
        maxTokenUsage: sql`GREATEST(${UserUsageTable.maxTokenUsage}, 5000000)`,
        subscriptionStatus: "active",
        paymentStatus: "succeeded"
      })
      .where(eq(UserUsageTable.userId, userId))
      .returning({ newMaxTokens: UserUsageTable.maxTokenUsage });

    revalidatePath('/claim-offer');
    return { 
      success: true,
      maxTokens: result[0].newMaxTokens
    };
  } catch (error: any) {
    console.error("Error claiming tokens:", error);
    return { error: error.message || "Failed to claim tokens" };
  }
}
