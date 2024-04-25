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

export default clerkMiddleware(async (auth, req) => {
  // do not run auth middleware if user management is disabled
  if (!process.env.ENABLE_USER_MANAGEMENT) {
    return NextResponse.next();
  }

  if (isApiRoute(req)) {
    // check api key
    const header = req.headers.get("authorization");
    if (!header) {
      return new Response("No Authorization header", { status: 401 });
    }
    const token = header.replace("Bearer ", "");
    const { result, error } = await verifyKey(token);
    if (error) {
      console.error(error.message);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!result.valid) {
      return new Response("Unauthorized", { status: 401 });
    }
    const client = PostHogClient();
    if (client && result?.ownerId) {
      // get user from api key
      const user = await clerkClient.users.getUser(result.ownerId);
      // check if customer or not
      const isCustomer = user?.publicMetadata?.stripe?.status === "complete";

      client.capture({
        distinctId: result?.ownerId,
        event: "call-api",
        properties: {
          endpoint: req.nextUrl.pathname.replace("/api/", ""),
          isCustomer,
        },
      });
    }

    return NextResponse.next();
  }
  if (isAuthRoute(req)) auth().protect();

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
