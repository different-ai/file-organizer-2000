import { clerkClient } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextRequest } from "next/server";
import { checkTokenUsage, incrementApiUsage } from "../drizzle/schema";
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

export async function handleAuthorization(req: NextRequest) {
  // this is to allow people to self host it easily without
  // setting up clerk
  if (!(process.env.ENABLE_USER_MANAGEMENT === "true")) {
    return { userId: "user", isCustomer: true };
  }

  const header = req.headers.get("authorization");
  const { url, method } = req;
  console.log({ url, method });
  if (!header) {
    console.error("No Authorization header");
    return {
      response: new Response("No Authorization header", { status: 401 }),
    };
  }
  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);
  if (!result.valid) {
    console.error(result);
    return {
      response: new Response(`Unauthorized ${result.code}`, { status: 401 }),
    };
  }
  const { remaining, usageError } = await checkTokenUsage(result.ownerId);
  if (usageError) {
    return {
      response: new Response("Error checking token usage", { status: 500 }),
    };
  }
  if (remaining <= 0) {
    return {
      response: new Response("Token usage exceeded", { status: 429 }),
    };
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
