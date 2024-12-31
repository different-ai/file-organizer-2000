'use server';

import { db, UserUsageTable, createEmptyUserUsage, christmasClaims, hasClaimedChristmasTokens } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from 'next/cache';
import { auth } from "@clerk/nextjs/server";

export async function claimTokens() {
  try {
    // Check if after deadline
    const deadline = new Date('2025-01-01');
    if (new Date() > deadline) {
      return { error: "This offer has expired" };
    }

    // Get authenticated user
    const { userId } = await auth();
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
    const hasClaimed = await hasClaimedChristmasTokens(userId);
    if (hasClaimed) {
      return { error: "You have already claimed this offer" };
    }

    // Record the claim
    await db.insert(christmasClaims).values({ userId });

    // Increase maxTokenUsage by 5M
    const result = await db
      .update(UserUsageTable)
      .set({
        maxTokenUsage: sql`COALESCE(${UserUsageTable.maxTokenUsage}, 0) + 5000000`
      })
      .where(eq(UserUsageTable.userId, userId))
      .returning({ newMaxTokens: UserUsageTable.maxTokenUsage });

    revalidatePath('/claim-offer');
    
    // Track successful claim in PostHog
    const PostHogClient = (await import("@/lib/posthog")).default;
    const posthog = PostHogClient();
    if (posthog) {
      await posthog.capture({
        distinctId: userId,
        event: 'christmas_tokens_claimed',
        properties: {
          tokens_amount: 5000000,
          new_max_tokens: result[0].newMaxTokens
        }
      });
    }

    return { 
      success: true,
      maxTokens: result[0].newMaxTokens
    };
  } catch (error: any) {
    console.error("Error claiming tokens:", error);
    return { error: error.message || "Failed to claim tokens" };
  }
}
