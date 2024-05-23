import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import PostHogClient from "./lib/posthog";
import { checkApiUsage, incrementApiUsage } from "./drizzle/schema";
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/(.*)"]);
const isCheckoutApiRoute = createRouteMatcher(["/api/create-checkout-session"]);
const isWebhookRoute = createRouteMatcher(["/api/webhook"]);

console.log(
  "ENABLE_USER_MANAGEMENT",
  process.env.ENABLE_USER_MANAGEMENT,
  "middleware"
);

async function handleAuthorization(req: NextRequest) {
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
  const { remaining, usageError } = await checkApiUsage(result.ownerId);
  if (error || usageError) {
    console.error(error.message);
    return { response: new Response("Internal Server Error", { status: 500 }) };
  }
  if (remaining <= 0) {
    return {
      response: new Response("No remaining credits", {
        status: 429,
      }),
    };
  }
  await incrementApiUsage(result.ownerId);

  // get user from api key
  const user = await clerkClient.users.getUser(result.ownerId);
  // check if customer or not
  //@ts-ignore
  const isCustomer = user?.publicMetadata?.stripe?.status === "complete";
  await handleLogging(req, result.ownerId, isCustomer, result.remaining);

  return { userId: result.ownerId, isCustomer, remaining: result.remaining };
}

async function handleLogging(
  req: NextRequest,
  userId: string,
  isCustomer: boolean,
  reamining: number
) {
  const user = await clerkClient.users.getUser(userId);
  console.log("user", user.emailAddresses[0]?.emailAddress);
  const client = PostHogClient();
  if (client) {
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

const soloApiKeyMiddleware = (req: NextRequest) => {
  if (isApiRoute(req)) {
    const header = req.headers.get("authorization");
    if (!header) {
      return new Response("No Authorization header", { status: 401 });
    }
    const token = header.replace("Bearer ", "");
    if (token !== process.env.SOLO_API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  return NextResponse.next();
};

const allowedOrigins = ["app://obsidian.md", "http://localhost:3000"];
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  const res = NextResponse.next();

  if (req.method === "OPTIONS") {
    console.log("OPTIONS");
    // Handle preflight requests
    const preflightHeaders = {
      ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      ...corsOptions,
      "Access-Control-Max-Age": "86400",
    };
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  if (isAllowedOrigin) {
    console.log("isAllowedOrigin", origin);
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // case 1: user management requires clerk
  if (process.env.ENABLE_USER_MANAGEMENT === "true") {
    return userManagementMiddleware()(req, event);
  }

  const isSoloInstance =
    process.env.SOLO_API_KEY && process.env.SOLO_API_KEY.length > 0;
  // case 2: single user API key
  if (isSoloInstance) {
    return soloApiKeyMiddleware(req);
  }

  // case 3: no user management, no API key
  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
