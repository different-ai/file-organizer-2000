import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserBillingCycle } from "./actions";

export default async function MainPage() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    redirect("/dashboard/self-hosted");
  }

  const { userId } = auth();


  const billingCycle = await getUserBillingCycle(userId);

  if (billingCycle === "monthly") {
    redirect("/dashboard/subscribers");
  } else if (billingCycle === "lifetime") {
    redirect("/dashboard/lifetime");
  } else {
    redirect("/dashboard/onboarding");
  }
}
