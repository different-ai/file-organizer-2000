import { clerkClient } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextRequest } from "next/server";
import {
  checkTokenUsage,
  checkUserSubscriptionStatus,
  incrementApiUsage,
} from "../drizzle/schema";
import PostHogClient from "./posthog";

async function handleLogging(
  req: NextRequest,
  userId: string,
  isCustomer: boolean
) {
  const user = await clerkClient.users.getUser(userId);
  console.log("user", user.emailAddresses[0]?.emailAddress);
  const client = PostHogClient();
  if (client) {
    client.capture({
      distinctId: userId,
      event: "call-api",
      properties: {
        endpoint: req.nextUrl.pathname.replace("/api/", ""),
        isCustomer,
        email: user?.emailAddresses[0]?.emailAddress,
      },
    });
  }
}

class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function handleAuthorization(req: NextRequest) {
  // this is to allow people to self host it easily without
  // setting up clerk
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return { userId: "user", isCustomer: true };
  }

  const header = req.headers.get("authorization");
  const { url, method } = req;
  console.log({ url, method });

  if (!header) {
    throw new AuthorizationError("No Authorization header", 401);
  }

  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);

  if (!result.valid) {
    console.error(result);
    throw new AuthorizationError(`Unauthorized: ${result.code}`, 401);
  }

  // Check if the user has a lifetime billing cycle
  if (result.meta?.billingCycle === "lifetime") {
    throw new AuthorizationError("Lifetime Access users need to provide their own key", 403);
  }

  // check if has active subscription
  const hasActiveSubscription = await checkUserSubscriptionStatus(
    result.ownerId
  );
  const client = PostHogClient();
  if (client) {
    client.capture({
      distinctId: result.ownerId,
      event: "subscription-status",
      properties: {
        status: hasActiveSubscription ? "active" : "inactive",
      },
    });
  }
  console.log("hasActiveSubscription", hasActiveSubscription, result.ownerId);
  if (!hasActiveSubscription) {
    throw new AuthorizationError("No active subscription", 401);
  }

  const { remaining, usageError } = await checkTokenUsage(result.ownerId);

  if (usageError) {
    throw new AuthorizationError("Error checking token usage", 500);
  }

  if (remaining <= 0) {
    throw new AuthorizationError("Rate limit exceeded", 429);
  }

  await incrementApiUsage(result.ownerId);
  // get user from api key
  const user = await clerkClient.users.getUser(result.ownerId);
  // check if customer or not
  const isCustomer =
    (user?.publicMetadata as CustomJwtSessionClaims["publicMetadata"])?.stripe
      ?.status === "complete";

  await handleLogging(req, result.ownerId, isCustomer);

  return { userId: result.ownerId, isCustomer };
}
