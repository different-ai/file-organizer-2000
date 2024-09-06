import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserBillingCycle } from "./actions";

export default async function MainPage() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    redirect("self-hosted");
  }

  const { userId } = auth();


  const billingCycle = await getUserBillingCycle(userId);
  console.log(billingCycle);

  if (billingCycle === "monthly") {
    redirect("subscribers");
  } else if (billingCycle === "lifetime") {
    redirect("/lifetime");
  } else {
    redirect("/onboarding");
  }
}
