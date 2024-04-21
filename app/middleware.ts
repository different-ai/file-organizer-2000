import { authMiddleware as clerkAuthMiddleware } from "@clerk/nextjs";
import { verifyKey } from "@unkey/api";
import { NextFetchEvent, NextRequest } from "next/server";

const authMiddleware = clerkAuthMiddleware({
  publicRoutes: [
    "/api/name",
    "/api/vision",
    "/api/audio",
    "/api/text",
    "/api/secret",
  ],
});

// only use authMiddleware if ENABLE_USER_MANAGEMENT is true, i.e. if user wishes to self host
export default async function middleware(
  req: NextRequest,
  res: NextFetchEvent
) {
  console.log("ENABLE_USER_MANAGEMENT", process.env.ENABLE_USER_MANAGEMENT);
  console.log("USE_OLLAMA", process.env.USE_OLLAMA);

  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    console.log("auth middleware", process.env.ENABLE_USER_MANAGEMENT);
    await authMiddleware(req, res);
  }

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
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
