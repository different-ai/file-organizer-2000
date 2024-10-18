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
    await srm.products.Lifetime.prices.lifetime.createOneTimePaymentCheckoutUrl(
      {
        userId: userId,
        successUrl: `${origin}/dashboard/lifetime`,
        cancelUrl: `${origin}/dashboard`,
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

  const checkoutUrl = await srm.products.HobbyMonthly.prices.monthly.createSubscriptionCheckoutUrl({
    userId,
    successUrl: `${origin}/dashboard/subscribers`,
    cancelUrl: `${origin}/dashboard`,
    allowPromotionCodes: true,
  });

  redirect(checkoutUrl);
}

export async function createYearlySubscriptionCheckout() {
  "use server";
  const { userId } = auth();

  const headersList = headers();
  const origin = headersList.get("origin") || "";

  const checkoutUrl = await srm.products.HobbyYearly.prices.yearly.createSubscriptionCheckoutUrl({
    userId,
    successUrl: `${origin}/dashboard/subscribers`,
    cancelUrl: `${origin}/dashboard`,
    allowPromotionCodes: true,
  });

  redirect(checkoutUrl);
}