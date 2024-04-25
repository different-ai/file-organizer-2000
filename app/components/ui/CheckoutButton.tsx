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

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unit_amount: 1499, // $14.99
        quantity: 1,
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
  //@ts-ignore
  if (user?.publicMetadata.stripe?.status === "complete") {
    return <Button>Thank you for your support!</Button>;
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? "Processing..." : "Get access to early features"}
    </Button>
  );
}
