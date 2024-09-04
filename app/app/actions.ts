"use server";
import {  createOrUpdateUserUsage } from "@/drizzle/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
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

export async function create() {
  "use server";
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const token = process.env.UNKEY_ROOT_KEY;
  const apiId = process.env.UNKEY_API_ID;

  if (!token || !apiId) {
    return null;
  }

  // const name = (formData.get("name") as string) ?? "My Awesome API";
  const name = "my api key";
  const unkey = new Unkey({ token });

  // Check if the user is a paid user
  const user = await clerkClient.users.getUser(userId);

  const isPaidUser =
    (user?.publicMetadata as CustomJwtSessionClaims["publicMetadata"])?.stripe
      ?.status === "complete";
      if (!isPaidUser) {
        throw new Error("User is not subscribed to a paid plan");
  }
  const billingCycle = await getUserBillingCycle(userId);
  await createOrUpdateUserUsage(userId, billingCycle);

  const key = await unkey.keys.create({
    name: name,
    ownerId: userId,
    meta: {
      billingCycle,
    },
    apiId,
  });
  return { key: key.result };
}

export async function getUserBillingCycle(userId: string) {
  if (!userId) return "monthly"; // Default to monthly if no userId

  try {
    const user = await db
      .select({ billingCycle: UserUsageTableImport.billingCycle })
      .from(UserUsageTableImport)
      .where(eq(UserUsageTableImport.userId, userId))
      .limit(1);

    return user[0]?.billingCycle || "monthly"; // Default to monthly if not found
  } catch (error) {
    console.error("Error fetching user billing cycle:", error);
    return "monthly"; // Default to monthly in case of error
  }
}
