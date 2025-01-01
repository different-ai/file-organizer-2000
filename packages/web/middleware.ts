import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isApiRoute = createRouteMatcher(["/api(.*)"]);

const isPublicRoute = createRouteMatcher([
  "/api(.*)",
  "/sign-in(.*)",
  "/webhook(.*)",
  "/top-up-success",
  "/top-up-cancelled",
]);

const isClerkProtectedRoute = createRouteMatcher(["/(.*)"]);

const userManagementMiddleware = () =>
  clerkMiddleware(async (auth, req) => {
    console.log("userManagementMiddleware");

    if (isPublicRoute(req)) {
      console.log("isPublicRoute");
      return NextResponse.next();
    }
    if (isClerkProtectedRoute(req)) {
      console.log("isClerkProtectedRoute");
      const { userId } = await auth();
      console.log("userId", userId);
      if (!userId) {
        // (await auth()).redirectToSignIn();
      }
    }
    return NextResponse.next();
  });

const soloApiKeyMiddleware = (req: NextRequest) => {
  if (isApiRoute(req)) {
    const header = req.headers.get("authorization");
    console.log("header", header);
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

  // Allow all origins
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    // Handle preflight requests
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const enableUserManagement = process.env.ENABLE_USER_MANAGEMENT === "true";

  const isSoloInstance =
    process.env.SOLO_API_KEY && process.env.SOLO_API_KEY.length > 0;

  if (enableUserManagement) {
    console.log("enableUserManagement", req.url);
    return userManagementMiddleware()(req, event);
  } else if (isSoloInstance) {
    return soloApiKeyMiddleware(req);
  }

  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
