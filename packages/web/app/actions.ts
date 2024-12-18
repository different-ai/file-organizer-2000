"use server";
import { auth,  } from "@clerk/nextjs/server";
import { Unkey } from "@unkey/api";
import { db, UserUsageTable as UserUsageTableImport } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

import { checkUserSubscriptionStatus } from "../drizzle/schema";

export async function isPaidUser(userId: string) {
  try {
    const isSubscribed = await checkUserSubscriptionStatus(userId);
    return isSubscribed;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

export async function createLicenseKeyFromUserId(userId: string) {
  const token = process.env.UNKEY_ROOT_KEY;
  const apiId = process.env.UNKEY_API_ID;
  console.log(
    "Unkey configuration - Token exists:",
    !!token,
    "API ID exists:",
    !!apiId
  );

  if (!token || !apiId) {
    return null;
  }

  const name = "my api key";
  const unkey = new Unkey({ token });


  console.log("Creating Unkey license key");
  const key = await unkey.keys.create({
    name: name,
    ownerId: userId,
    apiId,
  });

  console.log("License key created successfully", key.result);
  return { key: key.result };
}

export async function createLicenseKey() {
  "use server";
  const { userId } = auth();
  console.log("Creating license key - User authenticated:", !!userId);
  if (!userId) {
    return null;
  }
  return createLicenseKeyFromUserId(userId);
}

export async function getUserBillingCycle(userId: string) {
  if (!userId) return "none"; // Default to monthly if no userId

  try {
    const user = await db
      .select({ billingCycle: UserUsageTableImport.billingCycle })
      .from(UserUsageTableImport)
      .where(eq(UserUsageTableImport.userId, userId))
      .limit(1);

    return user[0]?.billingCycle || "none"; // Default to monthly if not found
  } catch (error) {
    console.error("Error fetching user billing cycle:", error);
    return "none"; // Default to monthly in case of error
  }
}
