"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./button";
import { useUser } from "@clerk/nextjs";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const handleCheckout = async () => {
    setLoading(true);

    // get plan type from query params
    const { searchParams } = new URL(window.location.href);
    const planType = searchParams.get("planType");
    let priceId;

    // get priceId based on planType
    if (planType === "yearly") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;
    } else {
      priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    }

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId: priceId,
      }),
    });

    const { session } = await response.json();

    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: session.id });

    setLoading(false);
  };
  if (!isLoaded) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? "Processing..." : "Start free trial"}
    </Button>
  );
}
