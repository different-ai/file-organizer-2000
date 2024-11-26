import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {  handleAuthorizationV2 } from "@/lib/handleAuthorization";
import { createAnonymousUser } from "../anon";
import { createLicenseKeyFromUserId } from "@/app/actions";
import { createEmptyUserUsage } from "@/drizzle/schema";
import { getTargetUrl } from "@/srm.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST(req: NextRequest) {
  // check fi there ir a user id if not create it
  let userId = "";
  try {
    ({ userId } = await handleAuthorizationV2(req));
  } catch (error) {
    console.log("Error getting user id", error);
    userId = (await createAnonymousUser()).id;
    await createEmptyUserUsage(userId);
  }
  console.log(userId)
  const licenseKey = await createLicenseKeyFromUserId(userId);

  const baseUrl = getTargetUrl();
  const targetUrl = baseUrl === "localhost:3000" 
    ? `http://${baseUrl}`
    : `https://${baseUrl}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    payment_intent_data: {
      metadata: {
        userId,
        type: "top_up",
        tokens: "5000000", // 5M tokens
      }
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "5M Tokens Top-up",
            description: "One-time purchase of 5M additional tokens",
          },
          unit_amount: 1500, // $15 in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${targetUrl}/top-up-success`,
    cancel_url: `${targetUrl}/top-up-cancelled`,
    metadata: {
      userId,
      type: "top_up",
      tokens: "5000000", // 5M tokens
    },
  });

  return NextResponse.json({ url: session.url, licenseKey });
}
