"use server";
import srm from "@/lib/srm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function createOneTimePaymentCheckout() {
  "use server";
  const { userId } = auth();

  const headersList = headers();
  const origin = headersList.get("origin") || "";

  const url =
    await srm.products.lifetime.prices.lifetime.createOneTimePaymentCheckoutUrl(
      {
        userId: userId,
        successUrl: `${origin}/lifetime`,
        cancelUrl: `${origin}/`,
        allowPromotionCodes: true,
      }
    );

  redirect(url);
}


export async function createSubscriptionCheckout() {
  "use server";
  const { userId } = auth();

  const headersList = headers();
  const origin = headersList.get("origin") || "";
  
  const checkoutUrl = await srm.products.Hobby.prices.monthly.createSubscriptionCheckoutUrl({
    userId,
    successUrl: `${origin}/subscribers`,
    cancelUrl: `${origin}/`,
    trialPeriodDays: 3,
    allowPromotionCodes: true,
  });

  redirect(checkoutUrl);
}