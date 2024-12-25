import Image from 'next/image';
import { db, UserUsageTable, createEmptyUserUsage } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from 'next/cache';
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { ClaimButton } from './claim-button';

export async function claimTokens() {
  'use server'
  
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

export default function ClaimOfferPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-8 text-center space-y-6">
      <h1 className="text-2xl font-bold">Free 5M Token Offer</h1>
      <p>Thank you for supporting File Organizer. Here's $15 worth of credits on us!</p>
      <Image
        src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWEwczVwdG40NzE1eG41ZzNwY3o2ZGk4c3lnN3ViMzcwcmk0Y202aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sZjZz0NjdQuOdjPmGY/giphy.webp"
        alt="Christmas GIF"
        width={300}
        height={180}
      />
      <ClaimButton />
    </div>
  );
}
