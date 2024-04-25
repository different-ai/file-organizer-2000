import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/api(.*)"]);
const isAuthRoute = createRouteMatcher(["/"]);

export default clerkMiddleware((auth, req) => {
  console.log(auth().sessionClaims);
  console.log(auth().actor);
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  if (isAuthRoute(req)) auth().protect();

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
