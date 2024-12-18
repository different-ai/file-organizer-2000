import { clerkClient } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextRequest } from "next/server";
import { checkTokenUsage } from "../drizzle/schema";
import PostHogClient from "./posthog";

/**
 * @deprecated This function is being deprecated in favor of a new authorization method.
 * Please use the new handleAuthorizationV2 function instead.
 */
async function handleLogging(
  req: NextRequest,
  userId: string,
  isCustomer: boolean
) {
  const user = await clerkClient().users.getUser(userId);
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

async function handleLoggingV2(
  req: NextRequest,
  userId: string,
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

export const getToken = (req: NextRequest) => {
  const header = req.headers.get("authorization");
  const token = header?.replace("Bearer ", "");
  return token;
};

export async function handleAuthorizationV2(req: NextRequest) {
  // this is to allow people to self host it easily without
  // setting up clerk
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return { userId: "user", isCustomer: true };
  }
  const token = getToken(req);
  const { result, error } = await verifyKey(token);
  if (!result.valid) {
    console.error(result);
    throw new AuthorizationError(`Unauthorized: ${result.code}`, 401);
  }
  console.log(result)
  // might require await
  handleLoggingV2(req, result.ownerId);
  return { userId: result.ownerId };
}

/**
 * @deprecated This function is being deprecated in favor of a new authorization method.
 * Please use the new handleAuthorizationV2 function instead.
 */
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

  // Check token usage
  const { remaining, usageError } = await checkTokenUsage(result.ownerId);
  console.log("remaining", remaining);

  if (usageError) {
    throw new AuthorizationError("Error checking token usage", 500);
  }

  if (remaining <= 0) {
    throw new AuthorizationError(
      "Credits limit exceeded. Top up your credits in settings.",
      429
    );
  }

  await handleLogging(req, result.ownerId, false);

  return { userId: result.ownerId };
}
