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
    console.log("Creating one-time payment session for user", userId);
    const session = await stripe.checkout.sessions.create({
      payment_intent_data: {
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
      allow_promotion_codes: true,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/members`,
      cancel_url: `${req.headers.get("origin")}/`,
    });
    console.log("One-time payment session created:", session.id);

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Error creating one-time payment session:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
