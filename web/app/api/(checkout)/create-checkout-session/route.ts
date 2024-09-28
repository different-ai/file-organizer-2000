import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import srm from "@/lib/srm";

export async function POST(req: NextRequest) {
  const { userId } = auth();

  try {
    console.log("Creating checkout session for user", userId);
    
    const checkoutUrl = await srm.products.Hobby.prices.monthly.createSubscriptionCheckoutUrl({
      userId,
      successUrl: `${req.headers.get("origin")}/subscribers`,
      cancelUrl: `${req.headers.get("origin")}/`,
      trialPeriodDays: 3,
      allowPromotionCodes: true,
    });

    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
