"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);

    // const response = await fetch("/api/create-checkout-session", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    //   }),
    // });

    // const { session } = await response.json();

    // const stripe = await stripePromise;
    // await stripe?.redirectToCheckout({ sessionId: session.id });
    router.push("/dashboard/planSelection");

    setLoading(false);
  };
  if (!isLoaded) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="border border-violet-500 text-violet-500"
    >
      {loading ? "Processing..." : "Start free trial"}
    </Button>
  );
}
