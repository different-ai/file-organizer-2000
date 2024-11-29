import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getToken, handleAuthorizationV2 } from "@/lib/handleAuthorization";
import { createAnonymousUser } from "../anon";
import { createLicenseKeyFromUserId } from "@/app/actions";
import { createEmptyUserUsage } from "@/drizzle/schema";
import { getTargetUrl } from "@/srm.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

async function createFallbackUser() {
  try {
    const user = await createAnonymousUser();
    await createEmptyUserUsage(user.id);
    const { key } = await createLicenseKeyFromUserId(user.id);
    return { userId: user.id, licenseKey: key.key };
  } catch (error) {
    console.error("Failed to create fallback user:", error);
    throw new Error("Unable to create or authorize user");
  }
}

async function ensureAuthorizedUser(req: NextRequest) {
  const initialLicenseKey = getToken(req);
  
  try {
    const { userId } = await handleAuthorizationV2(req);
    return { userId, licenseKey: initialLicenseKey };
  } catch (error) {
    console.log("Authorization failed, creating anonymous user:", error);
    return createFallbackUser();
  }
}

export async function POST(req: NextRequest) {
  let userId, licenseKey;
  
  try {
    ({ userId, licenseKey } = await ensureAuthorizedUser(req));
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
  
  const baseUrl = getTargetUrl();
  const targetUrl =
    baseUrl === "localhost:3000" ? `http://${baseUrl}` : `https://${baseUrl}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    payment_intent_data: {
      metadata: {
        userId,
        type: "top_up",
        tokens: "5000000", // 5M tokens
        price_key: "top_up_5m",
        product_key: "top_up_5m",
      },
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
    allow_promotion_codes: true,
    metadata: {
      userId,
      type: "top_up",
      tokens: "5000000", // 5M tokens
      price_key: "top_up_5m",
      product_key: "top_up_5m",
    },
  });

  return NextResponse.json({ url: session.url, licenseKey });
}
