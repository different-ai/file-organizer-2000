"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);
export default function Component() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelection = async (plan) => {
    setSelectedPlan(plan);
    handleCheckout(plan);
  };

  const handleCheckout = async (plan) => {
    console.log(plan);
    let priceId;
    if (plan === "lifetime") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID;
      const response = await fetch("/api/create-one-time-payment-session", {
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
    }
    if (plan === "monthly") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: priceId,
          priceName: plan,
        }),
      });
      const { session } = await response.json();

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: session.id });
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="container mx-auto px-4 py-16">
        <Logo />
        <h1 className="text-4xl font-bold mt-8 mb-2 text-center mb-8">
          Choose Your Plan
        </h1>
        {/* <p className="text-lg text-gray-500  mt-2 mb-6 text-center">
          Includes a 3-day free trial to get your Obsidian organized.
        </p> */}
        {/* <div className="bg-emerald-100 p-2 rounded-md text-emerald-900 text-center mb-8 max-w-md mx-auto">
          <SparkleIcon className="h-5 w-5 inline-block mr-2" />
          Special offer! Save $100 on the yearly plan. And over 45% off on the
          monthly plan. Only valid till end of July.
        </div> */}
        <div className="flex justify-center space-x-4 md:space-x-8">
          <Card className="w-[350px] p-6 bg-white rounded-lg shadow-md text-black md:w-[400px] relative border border-gray-500">
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-wide text-gray-600 text-center">
                Hobby Plan
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold">$15</span>
                </div>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                  monthly
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>3-day free trial</span>{" "}
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>~1000 files per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>120 min audio transcription</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>Seamless no-sweat setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>No external AI subscription needed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>30-day money-back guarantee</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    handlePlanSelection("monthly");
                  }}
                  className={`flex items-center justify-center gap-2 text-white bg-gray-900 px-6 py-3 rounded-md font-semibold border border-gray-900`}
                >
                  <span>Start Free Trial</span>
                </Button>
              </div>
            </div>
          </Card>
          <Card className="w-[350px] p-6 bg-white rounded-lg shadow-md text-black md:w-[400px] relative border border-gray-300">
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-wide text-gray-600 text-center">
                Lifetime License{" "}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-lg text-gray-600 line-through">
                    $150
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                  one-time payment
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>
                    Pay-as-you-go with your own OpenAl key
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>
                   Privacy-focused
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>Quick guided setup</span>
                </li>

                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>30-day money-back guarantee</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    handlePlanSelection("lifetime");
                  }}
                  className={`flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-md font-semibold border border-gray-900 transition-colors hover:bg-gray-100`}
                >
                  <span>I'm in!</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SparkleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
