import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import PostHogClient from "./lib/posthog";

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/(.*)"]);
const isCheckoutApiRoute = createRouteMatcher(["/api/create-checkout-session"]);
const isWebhookRoute = createRouteMatcher(["/api/webhook"]);

console.log(
  "ENABLE_USER_MANAGEMENT",
  process.env.ENABLE_USER_MANAGEMENT,
  "middleware"
);

async function handleAuthorization(req) {
  const header = req.headers.get("authorization");
  if (!header) {
    console.error("No Authorization header");
    return {
      response: new Response("No Authorization header", { status: 401 }),
    };
  }
  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);
  console.log("result", result);
  if (error) {
    console.error(error.message);
    return { response: new Response("Internal Server Error", { status: 500 }) };
  }

  // get user from api key
  const user = await clerkClient.users.getUser(result.ownerId);
  // check if customer or not
  //@ts-ignore
  const isCustomer = user?.publicMetadata?.stripe?.status === "complete";
  console.log("before logging");
  await handleLogging(req, result.ownerId, isCustomer, result.remaining);

  if (result.remaining <= 0) {
    return {
      response: new Response("No remaining credits", {
        status: 429,
      }),
    };
  }

  if (!result.valid) {
    console.error(result);
    return {
      response: new Response(`Unauthorized ${result.code}`, { status: 401 }),
    };
  }

  console.log("isCustomer", isCustomer);
  console.log("result", result);

  return { userId: result.ownerId, isCustomer, remaining: result.remaining };
}

async function handleLogging(
  req: NextRequest,
  userId: string,
  isCustomer: boolean,
  reamining: number
) {
  console.log("inside of handleLogging");
  const user = await clerkClient.users.getUser(userId);
  console.log("user", user);
  const client = PostHogClient();
  console.log("client", client);
  if (client && userId) {
    // client.identify({
    //   distinctId: userId,
    //   properties: {
    //     email: user.emailAddresses[0]?.emailAddress,
    //   },
    // });

    client.capture({
      distinctId: userId,
      event: "call-api",
      properties: {
        endpoint: req.nextUrl.pathname.replace("/api/", ""),
        isCustomer,
        remaining: reamining,
        email: user?.emailAddresses[0]?.emailAddress,
      },
    });
  }
}

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  console.log(
    "ENABLE_USER_MANAGEMENT",
    process.env.ENABLE_USER_MANAGEMENT,
    "bird"
  );
  if (process.env.ENABLE_USER_MANAGEMENT === "true") {
    return userManagementMiddleware()(req, event);
  }
  return NextResponse.next();
}

const userManagementMiddleware = () =>
  clerkMiddleware(async (auth, req) => {
    if (isWebhookRoute(req)) {
      return NextResponse.next();
    }
    if (isCheckoutApiRoute(req)) {
      auth().protect();
      return NextResponse.next();
    }

    if (isApiRoute(req)) {
      try {
        const { userId, isCustomer, response, remaining } =
          await handleAuthorization(req);
        if (response) return response;

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
