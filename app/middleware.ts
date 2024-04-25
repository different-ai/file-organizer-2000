import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextResponse } from "next/server";
import PostHogClient from "./lib/posthog";

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/(.*)"]);
const isCheckoutApiRoute = createRouteMatcher(["/api/create-checkout-session"]);
const isWebhookRoute = createRouteMatcher(["/api/webhook"]);

console.log("ENABLE_USER_MANAGEMENT", process.env.ENABLE_USER_MANAGEMENT);

async function handleAuthorization(req) {
  const header = req.headers.get("authorization");
  if (!header) {
    return {
      response: new Response("No Authorization header", { status: 401 }),
    };
  }
  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);
  if (error) {
    console.error(error.message);
    return { response: new Response("Internal Server Error", { status: 500 }) };
  }
  if (!result.valid) {
    return { response: new Response("Unauthorized", { status: 401 }) };
  }
  // get user from api key
  const user = await clerkClient.users.getUser(result.ownerId);
  // check if customer or not
  //@ts-ignore
  const isCustomer = user?.publicMetadata?.stripe?.status === "complete";
  console.log("isCustomer", isCustomer);

  return { userId: result.ownerId, isCustomer };
}

async function handleLogging(req, userId, isCustomer) {
  const client = PostHogClient();
  if (client && userId) {
    client.capture({
      distinctId: userId,
      event: "call-api",
      properties: {
        endpoint: req.nextUrl.pathname.replace("/api/", ""),
        isCustomer,
      },
    });
  }
}

export default clerkMiddleware(async (auth, req) => {
  // do not run auth middleware if user management is disabled
  if (!process.env.ENABLE_USER_MANAGEMENT) {
    return NextResponse.next();
  }
  if (isWebhookRoute(req)) {
    return NextResponse.next();
  }
  console.log("req.url", req.url);
  if (isCheckoutApiRoute(req)) {
    auth().protect();
    return NextResponse.next();
  }
  console.log("req.url2", req.url);

  if (isApiRoute(req)) {
    try {
      const { userId, isCustomer, response } = await handleAuthorization(req);
      if (response) return response;

      handleLogging(req, userId, isCustomer);
      return NextResponse.next();
    } catch (error) {
      return new Response("Unauthorized Internal", { status: 401 });
    }
  }

  if (isAuthRoute(req)) auth().protect();

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
