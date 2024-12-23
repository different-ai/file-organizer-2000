import { db, UserUsageTable } from "@/drizzle/schema";
import { PRODUCTS } from "@/srm.config";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

async function resetTokenUsage() {
  const monthlyTokenLimit = 5000 * 1000; // 5M tokens

  // Reset tokens for active subscribers with valid plans
  await db
    .update(UserUsageTable)
    .set({
      tokenUsage: 0,
      maxTokenUsage: monthlyTokenLimit,
    })
    .where(
      and(
        eq(UserUsageTable.subscriptionStatus, "active"),
        eq(UserUsageTable.paymentStatus, "paid")
      )
    );

  return { success: true, message: "Token usage reset successful" };
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