import { db, UserUsageTable } from "@/drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

async function resetTokenUsage() {
  const monthlyTokenLimit = 5000 * 1000; // 5M tokens

  // Reset tokens for active subscribers with valid plans
  const result = await db
    .update(UserUsageTable)
    .set({
      tokenUsage: 0,
      maxTokenUsage: monthlyTokenLimit,
    })
    .where(
      and(
        or(
          eq(UserUsageTable.subscriptionStatus, "active"),
          eq(UserUsageTable.subscriptionStatus, "succeeded"),
          eq(UserUsageTable.subscriptionStatus, "paid")
        ),
        or(
          eq(UserUsageTable.paymentStatus, "paid"),
          eq(UserUsageTable.paymentStatus, "succeeded")
        ),
        or(
          eq(UserUsageTable.billingCycle, "monthly"),
          eq(UserUsageTable.billingCycle, "yearly"),
          eq(UserUsageTable.billingCycle, "subscription"),
          eq(UserUsageTable.billingCycle, "default")
        ),
      )
    );

  // Get number of affected rows
  const affectedRows = result.rowCount;

  // return amount of users reset
  return { success: true, message: "Token usage reset successful", usersReset: affectedRows };
}

export async function GET(request: Request) {
  try {
    // Verify that the request is coming from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await resetTokenUsage();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting token usage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset token usage" },
      { status: 500 }
    );
  }
} 