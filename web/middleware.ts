import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/(.*)"]);
const isCheckoutApiRoute = createRouteMatcher(["/api/create-checkout-session"]);
const isWebhookRoute = createRouteMatcher(["/top-up-success", "/top-up-cancelled"]);

const isCheckoutRedirectRoute = createRouteMatcher(["/api/checkout-complete"]);
const userManagementMiddleware = () =>
  clerkMiddleware(async (auth, req) => {
    if (
      isWebhookRoute(req) ||
      isApiRoute(req) ||
      isCheckoutRedirectRoute(req)
    ) {
      return NextResponse.next();
    }
    if (isCheckoutApiRoute(req) || isAuthRoute(req)) {
      auth().protect();
    }
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

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const res = NextResponse.next();

  const enableUserManagement = process.env.ENABLE_USER_MANAGEMENT === "true";
  const isSoloInstance =
    process.env.SOLO_API_KEY && process.env.SOLO_API_KEY.length > 0;

  if (enableUserManagement) {
    return userManagementMiddleware()(req, event);
  } else if (isSoloInstance) {
    return soloApiKeyMiddleware(req);
  }

  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
