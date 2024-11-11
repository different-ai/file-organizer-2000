import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserBillingCycle } from "./actions";
import PostHogClient from "@/lib/posthog"; // Import the PostHog server client

export default async function MainPage() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    redirect("/dashboard/self-hosted");
  }

  const { userId } = auth();

  // If userId is not available, redirect to onboarding
  if (!userId) {
    redirect("/dashboard/onboarding"); // Or any other fallback
  }

  const billingCycle = await getUserBillingCycle(userId);

  // Initialize PostHog client
  const posthog = PostHogClient();

  // Capture the 'dashboard_entered' event
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event: "dashboard_entered",
      properties: {
        billing_cycle: billingCycle,
        // Add any additional properties
      },
    });

    // It's good practice to flush events to ensure they're sent before redirecting
    await posthog.flush();
  }

  // Redirect based on billing cycle
  if (billingCycle === "monthly") {
    redirect("/dashboard/subscribers");
  } else if (billingCycle === "lifetime") {
    redirect("/dashboard/lifetime");
  } else {
    redirect("/dashboard/onboarding");
  }
}
