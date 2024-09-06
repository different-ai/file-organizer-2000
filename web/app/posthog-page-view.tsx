// PostHog's $pageview autocapture relies on page load events.
// Since Next.js acts as a single-page app, this event doesn't trigger on navigation and we need to capture $pageview events manually.
// app/PostHogPageView.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useAuth, useUser } from '@clerk/nextjs'

export default function PostHogPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  // 👉 Check the sign-in status (from Clerk)
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    // Track pageviews
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, posthog]);

// Clerk integration
  useEffect(() => {
    if (isSignedIn && userId && user && !posthog._isIdentified()) {
      posthog.identify(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username,
      })
    }

      // 👉 Reset the user if they sign out
    if (!isSignedIn && posthog._isIdentified()) {
    posthog.reset()
  }
  }, [posthog, user])

  return null;
}
