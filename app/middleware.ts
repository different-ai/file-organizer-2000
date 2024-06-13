import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/(.*)"]);
const isCheckoutApiRoute = createRouteMatcher(["/api/create-checkout-session"]);
const isWebhookRoute = createRouteMatcher(["/api/webhook"]);

console.log(
  "ENABLE_USER_MANAGEMENT",
  process.env.ENABLE_USER_MANAGEMENT,
  "middleware"
);


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
      return NextResponse.next();
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
  console.log(
    "enabled user management ENVAR",
    process.env.ENABLE_USER_MANAGEMENT
  );
  // case 1: user management requires clerk
  if (process.env.ENABLE_USER_MANAGEMENT === "true") {
    console.log("enabled user management 2");
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
