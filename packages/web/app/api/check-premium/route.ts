import { NextRequest, NextResponse } from "next/server";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";
import { db, UserUsageTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function checkCatalyst(userId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ hasCatalystAccess: UserUsageTable.hasCatalystAccess })
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId))
      .limit(1);

    return result[0]?.hasCatalystAccess || false;
  } catch (error) {
    console.error('Error checking catalyst access:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await handleAuthorizationV2(request);
    const hasCatalystAccess = await checkCatalyst(userId);

    return NextResponse.json({ hasCatalystAccess });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check premium status" },
      { status: 500 }
    );
  }
}
