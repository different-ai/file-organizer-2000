import { NextResponse, NextRequest } from "next/server";
import { db, UserUsageTable } from "@/drizzle/schema";
import { and, eq, not } from "drizzle-orm";
import { verifyKey } from "@unkey/api";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { result } = await verifyKey(token || "");
    console.log(result)
    const userId = result?.ownerId;

    const userUsage = await db
      .select({
        tokenUsage: UserUsageTable.tokenUsage,
        maxTokenUsage: UserUsageTable.maxTokenUsage,
        subscriptionStatus: UserUsageTable.subscriptionStatus,
        currentPlan: UserUsageTable.currentPlan,
      })
      .from(UserUsageTable)
      .where(
        and(
          eq(UserUsageTable.userId, userId),
        )
      )
      .limit(1);

    if (!userUsage.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userUsage[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
