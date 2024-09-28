import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import srm from "@/lib/srm";


export async function POST(req: NextRequest) {
  const { userId } = auth();

  try {
    console.log("Creating one-time payment session for user", userId);
    
    const checkoutUrl = await srm.products.lifetime.prices.lifetime.createOneTimePaymentCheckoutUrl({
      userId,
      successUrl: `${req.headers.get("origin")}/lifetime`,
      cancelUrl: `${req.headers.get("origin")}/`,
      allowPromotionCodes: true,
      
    });

    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (error) {
    console.error("Error creating one-time payment session:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
