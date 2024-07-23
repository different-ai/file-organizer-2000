import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const { priceId } = await req.json();

  try {
    console.log("Creating checkout session for user", userId);
    const session = await stripe.checkout.sessions.create({
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId,
        },
      },

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/members`,
      cancel_url: `${req.headers.get("origin")}/`,
    });
    console.log("Checkout session created:", session.id);

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
