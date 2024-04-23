import { authMiddleware as clerkAuthMiddleware } from "@clerk/nextjs";
import { verifyKey } from "@unkey/api";
import { NextFetchEvent, NextRequest } from "next/server";
import PostHogClient from "./lib/posthog";

const authMiddleware = clerkAuthMiddleware({
  publicRoutes: (req) => req.url.includes("/api"),
});

// only use authMiddleware if ENABLE_USER_MANAGEMENT is true, i.e. if user wishes to self host
export default async function middleware(
  req: NextRequest,
  res: NextFetchEvent
) {
  console.log("ENABLE_USER_MANAGEMENT", process.env.ENABLE_USER_MANAGEMENT);
  console.log("USE_OLLAMA", process.env.USE_OLLAMA);
  // add auth to api
  if (
    process.env.ENABLE_USER_MANAGEMENT == "true" &&
    req.nextUrl.pathname.startsWith("/api")
  ) {
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
      client.capture({
        distinctId: result?.ownerId,
        event: "call-api",
        properties: { endpoint: req.nextUrl.pathname.replace("/api/", "") },
      });
    }
  }
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    return authMiddleware(req, res);
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
